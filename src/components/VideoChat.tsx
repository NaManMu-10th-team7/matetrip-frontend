import { useCallback, useEffect, useRef, useState } from 'react';
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

interface Props {
  workspaceId: string;
}

// 개별 비디오 박스를 렌더링하는 컴포넌트
interface ParticipantTileProps {
  streamManager: StreamManager;
  isLocal: boolean;
  isCamOn: boolean;
  isMicOn: boolean;
  isSpeaking: boolean;
  onToggleCamera: () => void;
  onToggleMic: () => void;
}

// 하나의 객체 ( session 안에 있는 하나의 유저 공간 )
function ParticipantTile({
  streamManager,
  isLocal,
  isCamOn,
  isMicOn,
  isSpeaking,
  onToggleCamera,
  onToggleMic,
}: ParticipantTileProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current) {
      streamManager.addVideoElement(videoRef.current);
    }
  }, [streamManager]);
  const controlsClass = isLocal ? '' : 'hidden';
  const buttonBase = 'px-1 flex items-center justify-center';

  const localButton = 'bg-transparent text-white focus-visible:outline-none';

  const highlightClass = isSpeaking
    ? 'border-4 border-blue-400 shadow-[0_0_36px_rgba(59,130,246,0.5)]'
    : 'border-4 border-transparent shadow-[0_0_36px_rgba(59,130,246,0.5)]';

  return (
    //모서리 둥글게가 안돼서 style 로 강제함
    <div
      className={` group relative flex h-full w-full transition-all duration-200 overflow-hidden ${highlightClass}
      `}
      style={{ borderRadius: '24px' }}
    >
      <video
        ref={videoRef}
        className={`h-full w-full object-cover transition-opacity ${
          !isCamOn ? 'opacity-0' : 'opacity-100'
        }`}
        autoPlay
        playsInline
        muted={isLocal}
      />
      {/* 카메라 꺼져있을 때 모두에게 공통되게 해당  */}
      {!isCamOn && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-3 bg-black text-white ">
          <User className="h-16 w-16" strokeWidth={1.5} />
          <span className="text-xs">카메라가 꺼져 있습니다</span>
        </div>
      )}

      {/* 버튼들 [카메라 & 마이크 ] */}
      <div
        className={`absolute inset-x-0 bottom-0 flex items-center gap-3 px-4 py-3 text-white ${controlsClass}`}
      >
        <button
          type="button"
          onClick={isLocal ? onToggleCamera : undefined}
          disabled={!isLocal}
          className={`${buttonBase} ${localButton}`}
          aria-label={isCamOn ? '카메라 끄기' : '카메라 켜기'}
        >
          {isCamOn ? (
            <Video className="h-5 w-5" />
          ) : (
            <VideoOff className="h-5 w-5" />
          )}
        </button>
        <button
          type="button"
          onClick={isLocal ? onToggleMic : undefined}
          disabled={!isLocal}
          className={`${buttonBase} ${localButton}`}
          aria-label={isMicOn ? '마이크 끄기' : '마이크 켜기'}
        >
          {isMicOn ? (
            <Mic className="h-5 w-5" />
          ) : (
            <MicOff className="h-5 w-5" />
          )}
        </button>
      </div>
    </div>
  );
}

export const VideoChat = ({ workspaceId }: Props) => {
  const [publisher, setPublisher] = useState<Publisher | null>(null);
  const [subscribers, setSubscribers] = useState<StreamManager[]>([]);
  //const [hasJoined, setHasJoined] = useState(false);
  const sessionRef = useRef<Session | null>(null);
  const [isCamOn, setIsCamOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  // 원격 참가자 별 카메라/마이크 상태를 streamId 기준으로 보관
  const [remoteStreamStates, setRemoteStreamStates] = useState<
    Record<
      string,
      { videoActive: boolean; audioActive: boolean; speaking: boolean }
    >
  >({});

  const joinSession = useCallback(async () => {
    if (sessionRef.current) return;
    try {
      //  1) Nest 서버에서 token 받아오기
      const res = await fetch('http://localhost:3000/openvidu/chatstart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId }),
      });

      const { token } = await res.json();
      if (!token) {
        throw new Error('OpenVidu 토큰을 가져오지 못했습니다.');
      }

      // 2) OpenVidu 객체 생성
      const OV = new OpenVidu();
      const newSession = OV.initSession();
      sessionRef.current = newSession;

      // 원격 참가자가 새 스트림을 게시할 때마다 올라오는 이벤트 => 다른 사람이 방에 들어오면 영상 추가
      newSession.on('streamCreated', (event: StreamEvent) => {
        // 내 스트림이면 무시
        if (
          event.stream.connection &&
          newSession.connection &&
          event.stream.connection.connectionId ===
            newSession.connection.connectionId
        ) {
          return;
        }

        const subscriber = newSession.subscribe(event.stream, undefined);
        setSubscribers((prev) => {
          if (
            prev.some((sub) => sub.stream?.streamId === event.stream.streamId)
          ) {
            return prev;
          }
          return [...prev, subscriber];
        });
        // 새 원격 스트림의 초기 비디오/오디오 상태 저장[남의 것도 저장]
        setRemoteStreamStates((prev) => ({
          ...prev,
          [event.stream.streamId]: {
            videoActive: event.stream.videoActive ?? true,
            audioActive: event.stream.audioActive ?? true,
            speaking: false,
          },
        }));
      });

      // 누군가 방을 나갈 때 실행되는 이벤트  => subscribers 목록에서 제거
      newSession.on('streamDestroyed', (event: StreamEvent) => {
        const streamId = event.stream.streamId;
        setSubscribers((prev) =>
          prev.filter((sub) => sub.stream?.streamId !== streamId)
        );
        setRemoteStreamStates((prev) => {
          const next = { ...prev };
          delete next[streamId];
          return next;
        });
      });
      //화면이랑 마이크 상태 체크(react한테 state 전해주기 위함)
      newSession.on(
        'streamPropertyChanged',
        (event: StreamPropertyChangedEvent) => {
          const streamId = event.stream.streamId;
          setRemoteStreamStates((prev) => {
            if (!prev[streamId]) {
              return prev;
            }
            // 상대방이 카메라/마이크를 토글할 때마다 상태를 업데이트
            if (event.changedProperty === 'videoActive') {
              return {
                ...prev,
                [streamId]: {
                  ...prev[streamId],
                  videoActive: event.newValue as boolean,
                },
              };
            }
            if (event.changedProperty === 'audioActive') {
              return {
                ...prev,
                [streamId]: {
                  ...prev[streamId],
                  audioActive: event.newValue as boolean,
                },
              };
            }
            return prev;
          });
        }
      );
      // 누군가 말하기 시작하면(speaking) → React 상태로 업데이트
      newSession.on(
        'publisherStartSpeaking',
        (event: PublisherSpeakingEvent) => {
          const streamId = event.streamId;
          console.log('[OpenVidu] publisherStartSpeaking', {
            streamId,
            isLocal:
              event.connection.connectionId ===
              newSession.connection?.connectionId,
          });
          if (
            newSession.connection &&
            event.connection.connectionId === newSession.connection.connectionId
          ) {
            setIsSpeaking(true);
            return;
          }
          setRemoteStreamStates((prev) => {
            const existing = prev[streamId] ?? {
              //기본값
              videoActive: true,
              audioActive: true,
              speaking: false,
            };
            return {
              ...prev,
              [streamId]: {
                ...existing,
                speaking: true,
              },
            };
          });
        }
      );
      //누군가 말하기 멈추면(stop speaking) → 상태 false로 업데이트
      newSession.on(
        'publisherStopSpeaking',
        (event: PublisherSpeakingEvent) => {
          const streamId = event.streamId;
          console.log('[OpenVidu] publisherStopSpeaking', {
            streamId,
            isLocal:
              event.connection.connectionId ===
              newSession.connection?.connectionId,
          });
          if (
            newSession.connection &&
            event.connection.connectionId === newSession.connection.connectionId
          ) {
            setIsSpeaking(false);
            return;
          }
          setRemoteStreamStates((prev) => {
            if (!prev[streamId]) return prev;
            return {
              ...prev,
              [streamId]: {
                ...prev[streamId],
                speaking: false,
              },
            };
          });
        }
      );

      //  3) 세션에 연결 (token 필요)
      await newSession.connect(token);

      //   5) 내 카메라/마이크 스트림 생성
      const newPublisher = await OV.initPublisherAsync(undefined, {
        videoSource: true,
        audioSource: true, //마이크
        publishVideo: false,
        publishAudio: false,
        resolution: '1280x720', //해상도
      });

      //  5) 세션에 스트림 publish (상대방에게 전달)
      newSession.publish(newPublisher);

      setPublisher(newPublisher);
      setIsCamOn(false);
      setIsMicOn(false);
    } catch (error) {
      console.error('화상 세션 연결에 실패했습니다.', error);
      sessionRef.current?.disconnect();
      sessionRef.current = null;
      setPublisher(null);
      setSubscribers([]);
      setIsCamOn(false);
      setIsMicOn(false);
      throw error;
    }
  }, [workspaceId]);
  const toggleCamera = async () => {
    if (!sessionRef.current) {
      await joinSession();
      return;
    }
    if (!publisher) return;

    const next = !isCamOn;
    publisher.publishVideo(next);
    setIsCamOn(next);
  };

  const toggleMic = async () => {
    if (!sessionRef.current) {
      await joinSession();
      return;
    }
    if (!publisher) return;

    const next = !isMicOn;
    publisher.publishAudio(next);
    setIsMicOn(next);
  };

  //   const leaveSession = () => {
  //     sessionRef.current?.disconnect();
  //     sessionRef.current = null;
  //     setPublisher(null);
  //     setSubscribers([]);
  //     setHasJoined(false);
  //     setIsCamOn(true);
  //     setIsMicOn(true);
  //   };

  useEffect(() => {
    joinSession().catch((err) => console.error(err));

    // 정리 로직
    return () => {
      sessionRef.current?.disconnect();
      sessionRef.current = null;
      setPublisher(null);
      setSubscribers([]);
      setRemoteStreamStates({});
      setIsCamOn(false);
      setIsMicOn(false);
      setIsSpeaking(false);
    };
  }, [joinSession]);

  //참가자 수에 맞춰 그리드의 가로·세로 칸 수를 동적 계산
  const participants = publisher ? [publisher, ...subscribers] : subscribers;
  const participantCount = participants.length;
  const columns = (() => {
    if (participantCount <= 1) return 1;
    if (participantCount === 2) return 2;
    if (participantCount === 3) return 3;
    if (participantCount === 4) return 2;
    //열 최대가 3임. 그 이후에는 행이 늘어남
    return Math.min(3, Math.ceil(Math.sqrt(participantCount)));
  })();
  console.log('VideoChat participantCount:', participantCount);
  const tiles = participants.map((streamManager) => {
    const isLocal = streamManager === publisher; //streamManager 와 publisher 가 값도 같고, 타입도 같으면 true
    const stream = streamManager.stream;
    const streamId = stream?.streamId ?? '';
    const remoteState = remoteStreamStates[streamId];
    //상대방의 마이크 꺼짐과 켜짐 유무를 알기위함
    const remoteVideoActive =
      remoteState?.videoActive ?? stream?.videoActive ?? true;
    const remoteAudioActive =
      remoteState?.audioActive ?? stream?.audioActive ?? true;
    const remoteSpeaking = remoteState?.speaking || false;
    console.log('[VideoChat] render tile', {
      streamId,
      isLocal,
      remoteVideoActive,
      remoteAudioActive,
      remoteSpeaking,
      isSpeakingLocal: isLocal ? isSpeaking : undefined,
    });

    console.log(
      'Tile streamId/local/videoActive/audioActive:',
      stream?.streamId,
      isLocal,
      remoteVideoActive,
      remoteAudioActive
    );
    return (
      <ParticipantTile
        key={streamManager.stream.streamId}
        streamManager={streamManager}
        isLocal={isLocal}
        isCamOn={isLocal ? isCamOn : remoteVideoActive}
        isMicOn={isLocal ? isMicOn : remoteAudioActive}
        isSpeaking={isLocal ? isSpeaking : remoteSpeaking}
        onToggleCamera={toggleCamera}
        onToggleMic={toggleMic}
      />
    );
  });

  const safeCount = Math.max(participantCount, 1);
  const rows = Math.ceil(safeCount / columns);
  const totalWidth = 600;
  const totalHeight = 150;
  const rowHeight = totalHeight / rows;
  const gap = safeCount > 1 ? 12 : 0;
  // 전체 화면 구성 그리드
  return (
    <div
      className="grid"
      style={{
        width: `${totalWidth}px`,
        height: `${totalHeight}px`,
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gridAutoRows: `${rowHeight}px`,
        gap: `${gap}px`,
      }}
    >
      {participantCount === 0 ? (
        <div className="flex items-center justify-center border border-gray-500/30 bg-gray-200 text-sm text-gray-500">
          연결 중입니다...
        </div>
      ) : (
        tiles
      )}
    </div>
  );
};
