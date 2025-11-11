import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, User, Video, VideoOff } from 'lucide-react';
import {
  OpenVidu,
  StreamEvent,
  StreamManager,
  Session,
  Publisher,
  PublisherSpeakingEvent,
  StreamPropertyChangedEvent,
} from 'openvidu-browser';
import { Button } from './ui/button';
import { useAuthStore } from '../store/authStore';
import { API_BASE_URL } from '../api/client.ts';

interface Props {
  workspaceId: string;
  onClose: () => void;
}

interface ParticipantTileProps {
  streamManager: StreamManager;
  isLocal: boolean;
  isCamOn: boolean;
  isMicOn: boolean;
  isSpeaking: boolean;
  nickname: string;
}

function ParticipantTile({
  streamManager,
  isLocal,
  isCamOn,
  isMicOn,
  isSpeaking,
  nickname,
}: ParticipantTileProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current) {
      streamManager.addVideoElement(videoRef.current);
    }
  }, [streamManager]);

  const highlightClass = isSpeaking
    ? 'ring-2 ring-blue-400'
    : 'ring-1 ring-gray-600';

  return (
    <div
      className={`relative flex aspect-video w-full overflow-hidden rounded-md bg-gray-800 text-white transition-all duration-200 ${highlightClass}`}
    >
      <video
        ref={videoRef}
        className={`h-full w-full object-cover ${!isCamOn && 'hidden'}`}
        autoPlay
        playsInline
        muted={isLocal}
      />
      {!isCamOn && (
        <div className="absolute inset-0 flex items-center justify-center">
          <User className="h-8 w-8 text-gray-400" strokeWidth={1.5} />
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between bg-black/30 px-2 py-1">
        <p className="text-white text-xs truncate">{nickname}</p>
        {isMicOn ? (
          <Mic className="h-3 w-3 text-white" />
        ) : (
          <MicOff className="h-3 w-3 text-red-500" />
        )}
      </div>
    </div>
  );
}

export const VideoChat = ({ workspaceId, onClose }: Props) => {
  const { user } = useAuthStore();
  const localNickname = user?.profile.nickname || 'Anonymous';

  const [publisher, setPublisher] = useState<Publisher | null>(null);
  const [subscribers, setSubscribers] = useState<StreamManager[]>([]);
  const sessionRef = useRef<Session | null>(null);
  const [isCamOn, setIsCamOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [remoteStreamStates, setRemoteStreamStates] = useState<
    Record<
      string,
      { videoActive: boolean; audioActive: boolean; speaking: boolean }
    >
  >({});
  const [nicknames, setNicknames] = useState<Record<string, string>>({});

  useEffect(() => {
    let currentSession: Session | null = null;

    const setupSession = async () => {
      if (sessionRef.current) {
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/openvidu/chatstart`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workspaceId }),
        });

        const { token } = await res.json();
        if (!token) throw new Error('OpenVidu 토큰을 가져오지 못했습니다.');

        const OV = new OpenVidu();
        currentSession = OV.initSession();
        sessionRef.current = currentSession;

        currentSession.on('streamCreated', (event: StreamEvent) => {
          if (
            event.stream.connection.connectionId ===
            currentSession?.connection?.connectionId
          )
            return;
          const subscriber = currentSession!.subscribe(event.stream, undefined);
          const clientData = JSON.parse(
            event.stream.connection.data
          ).clientData;
          setSubscribers((prev) => [...prev, subscriber]);
          setNicknames((prev) => ({
            ...prev,
            [event.stream.streamId]: clientData,
          }));
          setRemoteStreamStates((prev) => ({
            ...prev,
            [event.stream.streamId]: {
              videoActive: event.stream.videoActive,
              audioActive: event.stream.audioActive,
              speaking: false,
            },
          }));
        });

        currentSession.on('streamDestroyed', (event: StreamEvent) => {
          const streamId = event.stream.streamId;
          setSubscribers((prev) =>
            prev.filter((sub) => sub.stream.streamId !== streamId)
          );
          setRemoteStreamStates((prev) => {
            const next = { ...prev };
            delete next[streamId];
            return next;
          });
          setNicknames((prev) => {
            const next = { ...prev };
            delete next[streamId];
            return next;
          });
        });

        currentSession.on(
          'streamPropertyChanged',
          (event: StreamPropertyChangedEvent) => {
            const { stream, changedProperty, newValue } = event;
            setRemoteStreamStates((prev) => ({
              ...prev,
              [stream.streamId]: {
                ...prev[stream.streamId],
                [changedProperty as string]: newValue,
              },
            }));
          }
        );

        currentSession.on(
          'publisherStartSpeaking',
          (event: PublisherSpeakingEvent) => {
            if (
              event.connection.connectionId ===
              currentSession?.connection?.connectionId
            ) {
              setIsSpeaking(true);
            } else {
              setRemoteStreamStates((prev) => ({
                ...prev,
                [event.streamId]: { ...prev[event.streamId], speaking: true },
              }));
            }
          }
        );

        currentSession.on(
          'publisherStopSpeaking',
          (event: PublisherSpeakingEvent) => {
            if (
              event.connection.connectionId ===
              currentSession?.connection?.connectionId
            ) {
              setIsSpeaking(false);
            } else {
              setRemoteStreamStates((prev) => ({
                ...prev,
                [event.streamId]: { ...prev[event.streamId], speaking: false },
              }));
            }
          }
        );

        await currentSession.connect(token, { clientData: localNickname });

        const newPublisher = await OV.initPublisherAsync(undefined, {
          audioSource: true,
          videoSource: true,
          publishAudio: false,
          publishVideo: false,
          resolution: '320x240',
          frameRate: 15,
        });

        await currentSession.publish(newPublisher);
        setPublisher(newPublisher);
        setIsCamOn(false);
        setIsMicOn(false);
      } catch (error) {
        console.error('화상 세션 연결 실패:', error);
        onClose();
        if (currentSession) {
          currentSession.disconnect();
          sessionRef.current = null;
        }
      }
    };

    setupSession();

    return () => {
      if (currentSession) {
        currentSession.disconnect();
      }
      // 상태 초기화
      sessionRef.current = null;
      setPublisher(null);
      setSubscribers([]);
      setNicknames({});
      setRemoteStreamStates({});
      setIsCamOn(false);
      setIsMicOn(false);
      setIsSpeaking(false);
    };
  }, [workspaceId, onClose, localNickname]);

  const toggleCamera = () => {
    if (publisher) {
      const nextState = !isCamOn;
      publisher.publishVideo(nextState);
      setIsCamOn(nextState);
    }
  };

  const toggleMic = () => {
    if (publisher) {
      const nextState = !isMicOn;
      publisher.publishAudio(nextState);
      setIsMicOn(nextState);
    }
  };

  const participants = publisher ? [publisher, ...subscribers] : subscribers;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-2 grid-cols-2">
        {participants.length === 0 ? (
          <div className="col-span-2 flex items-center justify-center text-gray-500 text-sm aspect-video bg-gray-100 rounded-md">
            연결 중...
          </div>
        ) : (
          participants.map((streamManager) => {
            const isLocal = streamManager === publisher;
            const streamId = streamManager.stream.streamId;
            const remoteState = remoteStreamStates[streamId];
            const nickname = isLocal
              ? localNickname
              : nicknames[streamId] || '...';

            return (
              <ParticipantTile
                key={streamId}
                streamManager={streamManager}
                isLocal={isLocal}
                isCamOn={
                  isLocal ? isCamOn : (remoteState?.videoActive ?? false)
                }
                isMicOn={
                  isLocal ? isMicOn : (remoteState?.audioActive ?? false)
                }
                isSpeaking={
                  isLocal ? isSpeaking : (remoteState?.speaking ?? false)
                }
                nickname={nickname}
              />
            );
          })
        )}
      </div>
      <div className="flex justify-center items-center gap-2">
        <Button
          size="icon"
          variant={isMicOn ? 'secondary' : 'destructive'}
          onClick={toggleMic}
          className="rounded-full w-9 h-9"
        >
          {isMicOn ? (
            <Mic className="w-5 h-5" />
          ) : (
            <MicOff className="w-5 h-5" />
          )}
        </Button>
        <Button
          size="icon"
          variant={isCamOn ? 'secondary' : 'destructive'}
          onClick={toggleCamera}
          className="rounded-full w-9 h-9"
        >
          {isCamOn ? (
            <Video className="w-5 h-5" />
          ) : (
            <VideoOff className="w-5 h-5" />
          )}
        </Button>
      </div>
    </div>
  );
};
