import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Loader2,
  Mic,
  MicOff,
  RefreshCw,
  User,
  Users,
  Video,
  VideoOff,
  WifiOff,
  X, // 닫기 버튼 아이콘 추가
} from 'lucide-react';
import {
  type Attendee,
  type AudioVideoFacade,
  type AudioVideoObserver,
  ConsoleLogger,
  DefaultDeviceController,
  DefaultMeetingSession,
  MeetingSessionConfiguration,
  type VideoTileState,
  LogLevel,
} from 'amazon-chime-sdk-js';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useAuthStore } from '../store/authStore';
import client from '../api/client';
import { cn } from './ui/utils'; // cn 유틸리티 임포트

// amazon-chime-sdk-js는 브라우저 환경에서 node의 global 객체를 기대하므로 안전하게 polyfill
if (typeof (global as any) === 'undefined' && typeof window !== 'undefined') {
  (window as any).global = window;
}

interface Props {
  workspaceId: string;
  onClose: () => void;
  activeMembers?: {
    id: string;
    name: string;
    avatar?: string;
    userId?: string;
    profileId?: string;
    email?: string;
  }[];
}

interface JoinResponse {
  meeting: any; // `Meeting` 타입이 export되지 않으므로 any로 변경
  attendee: Attendee;
}

type MeetingStatus = 'idle' | 'joining' | 'joined' | 'error';

interface TileInfo {
  tileId: number | null; // null이 될 수 있으므로 타입 변경
  attendeeId: string;
  name: string;
  externalUserId?: string;
  isLocal: boolean;
  isVideoActive: boolean;
}

export const VideoChat = ({
  workspaceId: initialWorkspaceId,
  onClose,
  activeMembers = [],
}: Props) => {
  const { user } = useAuthStore();

  const workspaceId = initialWorkspaceId || '';
  const userId = user?.userId ?? '';
  const username = user?.profile.nickname ?? '';
  const [status, setStatus] = useState<MeetingStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isMicMuted, setIsMicMuted] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(false); // 카메라 기본값 OFF
  const [tiles, setTiles] = useState<TileInfo[]>([]);
  const [participantCount, setParticipantCount] = useState(0);

  const audioVideoRef = useRef<AudioVideoFacade | null>(null);
  const meetingSessionRef = useRef<DefaultMeetingSession | null>(null);
  const videoElementRefs = useRef<Record<number, HTMLVideoElement | null>>({});
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const observerRef = useRef<AudioVideoObserver | null>(null);
  const attendeePresenceHandlerRef = useRef<
    | ((
        attendeeId: string,
        present: boolean,
        externalUserId?: string,
        dropped?: boolean
      ) => void)
    | null
  >(null);
  const attendeeNamesRef = useRef<Record<string, string>>({});

  const localDisplayName = useMemo(() => username?.trim() || 'Me', [username]);

  const resetSessionState = useCallback(() => {
    setIsMicMuted(true);
    setIsCameraOn(false);
    setTiles([]);
    setParticipantCount(0);
    attendeeNamesRef.current = {};
  }, []);

  const cleanupMeeting = useCallback(() => {
    const audioVideo = audioVideoRef.current;

    if (audioVideo) {
      if (attendeePresenceHandlerRef.current) {
        audioVideo.realtimeUnsubscribeToAttendeeIdPresence(
          attendeePresenceHandlerRef.current
        );
      }
      if (observerRef.current) {
        audioVideo.removeObserver(observerRef.current);
      }
      audioVideo.stopLocalVideoTile();
      audioVideo.stop();
      // [추가] 명시적으로 비디오/오디오 입력 중지
      audioVideo.stopVideoInput();
      audioVideo.stopAudioInput();
    }

    audioVideoRef.current = null;
    meetingSessionRef.current = null;
    observerRef.current = null;
    attendeePresenceHandlerRef.current = null;
    resetSessionState();
  }, [resetSessionState]);

  useEffect(() => cleanupMeeting, [cleanupMeeting]);

  const bindVideoElement = useCallback(
    (tileId: number, el: HTMLVideoElement | null) => {
      videoElementRefs.current[tileId] = el;
      if (audioVideoRef.current && el) {
        audioVideoRef.current.bindVideoElement(tileId, el);
      }
    },
    []
  );

  const updateParticipantCount = useCallback(
    (names: Record<string, string>) => {
      // [수정] attendeeNamesRef.current에 로컬 사용자가 이미 포함되어 있으므로, 단순히 키의 개수를 셉니다.
      setParticipantCount(Object.keys(names).length);
    },
    []
  );

  const handleJoin = async () => {
    if (!workspaceId || !userId) {
      setErrorMessage('workspaceId와 userId는 필수입니다.');
      setStatus('error');
      return;
    }

    setStatus('joining');
    setErrorMessage(null);
    cleanupMeeting();

    try {
      const { data } = await client.post<JoinResponse>(
        `/workspace/${workspaceId}/chime/join`,
        {
          userId,
          username: username?.trim() || undefined,
        }
      );

      const logger = new ConsoleLogger('ChimeMeeting', LogLevel.WARN);
      const deviceController = new DefaultDeviceController(logger);
      const configuration = new MeetingSessionConfiguration(
        data.meeting,
        data.attendee
      );
      const meetingSession = new DefaultMeetingSession(
        configuration,
        logger,
        deviceController
      );
      meetingSessionRef.current = meetingSession;

      const audioVideo = meetingSession.audioVideo;
      audioVideoRef.current = audioVideo;

      const audioInputs = await audioVideo.listAudioInputDevices();
      if (audioInputs.length > 0) {
        await audioVideo.startAudioInput(audioInputs[0].deviceId);
      }

      // [수정] 카메라를 자동으로 켜지 않음. 로컬 비디오 타일은 시작하지 않음.
      setIsCameraOn(false);

      const observer: AudioVideoObserver = {
        audioVideoDidStart: () => setStatus('joined'),
        videoTileDidUpdate: (tileState: VideoTileState) => {
          if (!tileState.boundAttendeeId || tileState.isContent) return;

          const boundAttendeeId = tileState.boundAttendeeId;

          const isLocal =
            boundAttendeeId ===
            meetingSession.configuration.credentials?.attendeeId;
          const name = resolveParticipantName(
            boundAttendeeId,
            tileState.boundExternalUserId,
            isLocal
          );
          // [추가] 로컬 타일의 isVideoActive 상태를 isCameraOn과 동기화
          const isVideoActive = isLocal
            ? isCameraOn
            : !!tileState.active && !tileState.paused;

          if (!isLocal) {
            attendeeNamesRef.current[boundAttendeeId] = name;
            updateParticipantCount(attendeeNamesRef.current);
          }

          setTiles((prev) => {
            const others = prev.filter((t) => t.tileId !== tileState.tileId);
            const newTiles = [
              ...others,
              {
                tileId: tileState.tileId,
                attendeeId: boundAttendeeId,
                name,
                externalUserId: tileState.boundExternalUserId ?? undefined,
                isLocal,
                isVideoActive,
              },
            ];
            return newTiles;
          });
        },
        videoTileWasRemoved: (tileId: number) => {
          setTiles((prev) => {
            const newTiles = prev.filter((t) => t.tileId !== tileId);
            return newTiles;
          });
        },
        audioVideoDidStop: () => {
          setStatus('idle');
          cleanupMeeting();
        },
      };

      observerRef.current = observer;
      audioVideo.addObserver(observer);

      // [수정] 로컬 사용자 이름은 여기서 한 번만 추가
      attendeeNamesRef.current[data.attendee.attendeeId] = localDisplayName;
      updateParticipantCount(attendeeNamesRef.current);

      const presenceHandler = (
        attendeeId: string,
        present: boolean,
        externalUserId?: string
      ) => {
        // [수정] 로컬 사용자는 presenceHandler에서 처리하지 않음
        if (
          attendeeId === meetingSession.configuration.credentials?.attendeeId
        ) {
          return;
        }

        const externalMatch =
          nameFromExternal(externalUserId) ||
          activeMemberNameMap[attendeeId] ||
          activeMemberNameMap[attendeeId.toLowerCase()];

        attendeeNamesRef.current = {
          ...attendeeNamesRef.current,
          ...(present
            ? {
                [attendeeId]: resolveParticipantName(
                  attendeeId,
                  externalUserId || externalMatch || undefined,
                  false // isLocal은 항상 false
                ),
              }
            : {}),
        };

        if (!present) {
          const { [attendeeId]: _, ...rest } = attendeeNamesRef.current;
          attendeeNamesRef.current = rest;
        }

        updateParticipantCount(attendeeNamesRef.current);
      };

      attendeePresenceHandlerRef.current = presenceHandler;
      audioVideo.realtimeSubscribeToAttendeeIdPresence(presenceHandler);

      if (audioElementRef.current) {
        audioVideo.bindAudioElement(audioElementRef.current);
      }

      audioVideo.start();
      audioVideo.realtimeMuteLocalAudio();
      setIsMicMuted(true);
    } catch (error: any) {
      console.error('Amazon Chime 회의 접속 실패:', error);
      setStatus('error');
      setErrorMessage(
        error?.response?.data?.message ||
          '회의 연결에 실패했습니다. 입력값을 확인하고 다시 시도해주세요.'
      );
      cleanupMeeting();
      onClose();
    }
  };

  const handleLeave = useCallback(() => {
    cleanupMeeting();
    setStatus('idle');
    onClose();
  }, [cleanupMeeting, onClose]);

  const toggleMic = () => {
    if (!audioVideoRef.current) return;
    const audioVideo = audioVideoRef.current;
    if (isMicMuted) {
      audioVideo.realtimeUnmuteLocalAudio();
      setIsMicMuted(false);
    } else {
      audioVideo.realtimeMuteLocalAudio();
      setIsMicMuted(true);
    }
  };

  const toggleCamera = async () => {
    if (!audioVideoRef.current) return;
    const audioVideo = audioVideoRef.current;
    if (isCameraOn) {
      await audioVideo.stopVideoInput();
      audioVideo.stopLocalVideoTile();
      setIsCameraOn(false);
      return;
    }

    const videoInputs = await audioVideo.listVideoInputDevices();
    if (videoInputs.length === 0) {
      setErrorMessage('사용 가능한 카메라가 없습니다.');
      setStatus('error');
      return;
    }

    // [수정] 카메라 켤 때 순서 명확히
    await audioVideo.startVideoInput(videoInputs[0].deviceId);
    audioVideo.startLocalVideoTile();
    setIsCameraOn(true);
  };

  const activeMemberNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    const addKey = (key?: string, name?: string) => {
      if (!key || !name) return;
      map[key] = name;
      map[key.toLowerCase()] = name;
    };

    activeMembers.forEach((member) => {
      addKey(member.id, member.name); // `id` is `userId` from ActiveMember
      if (member.userId) addKey(member.userId, member.name);
      if (member.profileId) addKey(member.profileId, member.name);
      if (member.email) addKey(member.email, member.name);
      if (member.name) addKey(member.name, member.name);
    });
    return map;
  }, [activeMembers]);

  const isUuid = useCallback((value?: string) => {
    if (!value) return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value.trim()
    );
  }, []);

  const nameFromExternal = useCallback(
    (externalUserId?: string) => {
      if (!externalUserId) return null;

      // [수정] 비알파벳 숫자 접두사 제거
      const cleanedExternalUserId = externalUserId.replace(
        /^[^a-zA-Z0-9]+/,
        ''
      );
      const trimmed = cleanedExternalUserId.trim();

      // [추가] externalUserId가 userId와 동일한 경우 activeMemberNameMap에서 찾도록
      const memberByUserId = activeMembers.find(
        (member) => member.userId === trimmed
      );
      if (memberByUserId) return memberByUserId.name;

      const byId =
        activeMemberNameMap[trimmed] ||
        activeMemberNameMap[trimmed.toLowerCase()];
      if (byId) return byId;
      if (!isUuid(trimmed)) return trimmed;
      return null;
    },
    [activeMemberNameMap, isUuid, activeMembers]
  );

  const resolveParticipantName = useCallback(
    (
      attendeeId: string,
      externalUserId: string | undefined | null,
      isLocal: boolean
    ) => {
      if (isLocal) {
        return localDisplayName;
      }

      const extName = nameFromExternal(externalUserId ?? undefined);
      if (extName) {
        return extName;
      }

      const mappedByAttendeeId =
        activeMemberNameMap[attendeeId] ||
        activeMemberNameMap[attendeeId.toLowerCase()];
      if (mappedByAttendeeId) {
        return mappedByAttendeeId;
      }

      const stored = attendeeNamesRef.current[attendeeId];
      if (stored && !isUuid(stored)) {
        return stored;
      }

      if (externalUserId && !isUuid(externalUserId)) {
        return externalUserId.trim();
      }

      return '참가자';
    },
    [activeMemberNameMap, isUuid, localDisplayName, nameFromExternal]
  );

  const isBusy = status === 'joining';

  useEffect(() => {
    if (tiles.length === 0) return;

    let changed = false;
    const updated = tiles.map((tile) => {
      if (tile.attendeeId) {
        const newName = resolveParticipantName(
          tile.attendeeId,
          tile.externalUserId,
          tile.isLocal
        );
        if (newName !== tile.name) {
          attendeeNamesRef.current[tile.attendeeId] = newName;
          changed = true;
          return { ...tile, name: newName };
        }
      }
      return tile;
    });

    if (changed) {
      setTiles(updated);
      updateParticipantCount(attendeeNamesRef.current);
    }
  }, [activeMembers, tiles, resolveParticipantName, updateParticipantCount]);

  // [추가] joined 상태가 되고 isCameraOn이 false일 때 로컬 비디오 타일 중지
  useEffect(() => {
    if (status === 'joined' && !isCameraOn && audioVideoRef.current) {
      audioVideoRef.current.stopLocalVideoTile();
    }
  }, [status, isCameraOn]);

  const renderVideoTiles = () => {
    if (tiles.length === 0) {
      return (
        <div className="col-span-1 flex aspect-video w-full max-h-[180px] flex-col items-center justify-center gap-2 rounded-md border border-dashed border-gray-300 bg-gray-50 text-gray-500">
          {status === 'joining' ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <WifiOff className="h-6 w-6" />
          )}
          <p className="text-sm text-gray-600">
            회의에 접속하면 영상 타일이 나타납니다.
          </p>
        </div>
      );
    }

    // 참가자 수에 따라 그리드 레이아웃 동적 변경
    const gridColsClass = tiles.length > 1 ? 'grid-cols-2' : 'grid-cols-1';
    const tileHeightClass =
      tiles.length > 1
        ? 'min-h-[120px] max-h-[180px]'
        : 'min-h-[160px] max-h-[220px]';

    return (
      <div
        className={cn(
          'grid gap-2',
          gridColsClass,
          tiles.length > 2 ? 'max-h-[360px]' : 'max-h-[220px]',
          'overflow-y-auto'
        )}
      >
        {tiles.map((tile) => (
          <div
            key={tile.tileId}
            className={cn(
              'relative flex aspect-video w-full overflow-hidden rounded-md bg-gray-900 text-white shadow-inner',
              tileHeightClass
            )}
          >
            <video
              ref={(el: HTMLVideoElement | null) => {
                if (tile.tileId !== null) {
                  bindVideoElement(tile.tileId, el);
                }
              }}
              className={`h-full w-full object-cover ${
                tile.isLocal
                  ? !isCameraOn
                    ? 'hidden'
                    : ''
                  : !tile.isVideoActive
                    ? 'hidden'
                    : ''
              }`}
              autoPlay
              playsInline
              muted={tile.isLocal}
            />
            {((tile.isLocal && !isCameraOn) ||
              (!tile.isLocal && !tile.isVideoActive)) && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <User className="h-10 w-10 text-gray-400" strokeWidth={1.5} />
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between bg-black/40 px-3 py-2 text-xs">
              <span className="truncate text-white">{tile.name}</span>
              <Badge
                variant={tile.isLocal ? 'secondary' : 'default'}
                className="flex items-center gap-1 border-none bg-white/20 text-white"
              >
                {tile.isLocal ? '나' : '참가자'}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col rounded-lg border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
        <div className="flex items-center gap-2">
          <Video className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-gray-800">화상 통화</h3>
          <Badge
            variant={status === 'joined' ? 'default' : 'secondary'}
            className={cn(
              'flex items-center gap-1',
              status === 'joined'
                ? 'bg-green-500 text-white'
                : 'bg-gray-300 text-gray-700'
            )}
          >
            <Users className="h-4 w-4" />
            <span>참가자 {participantCount}명</span>
          </Badge>
        </div>
        <Button size="icon" variant="ghost" onClick={handleLeave}>
          <X className="h-5 w-5 text-gray-500" />
        </Button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {status === 'idle' && (
          <div className="flex flex-col items-center justify-center gap-4 py-8">
            <VideoOff className="h-12 w-12 text-gray-400" />
            <p className="text-center text-gray-600">
              아직 회의에 참여하지 않았습니다. <br />
              아래 버튼을 눌러 화상 통화를 시작하세요.
            </p>
            <Button
              onClick={handleJoin}
              disabled={isBusy}
              className="w-full max-w-[200px]"
            >
              {isBusy ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  접속 중...
                </span>
              ) : (
                '회의 접속'
              )}
            </Button>
          </div>
        )}

        {status === 'joining' && (
          <div className="flex flex-col items-center justify-center gap-4 py-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-center text-gray-600">
              화상 통화에 연결 중입니다... <br />
              잠시만 기다려주세요.
            </p>
          </div>
        )}

        {status === 'error' && errorMessage && (
          <div className="flex flex-col items-center justify-center gap-4 py-8">
            <AlertCircle className="h-12 w-12 text-red-500" />
            <p className="text-center text-red-600">
              회의 연결에 실패했습니다. <br />
              {errorMessage}
            </p>
            <Button onClick={handleJoin} className="w-full max-w-[200px]">
              재시도
            </Button>
          </div>
        )}

        {status === 'joined' && (
          <>
            <div className="mb-4">{renderVideoTiles()}</div>{' '}
            {/* 영상 타일 직접 렌더링 */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button
                size="icon"
                variant={isMicMuted ? 'destructive' : 'secondary'}
                onClick={toggleMic}
                className={cn(
                  'h-12 w-12 rounded-full',
                  isMicMuted
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                )}
              >
                {isMicMuted ? (
                  <MicOff className="h-6 w-6" />
                ) : (
                  <Mic className="h-6 w-6" />
                )}
              </Button>
              <Button
                size="icon"
                variant={isCameraOn ? 'secondary' : 'destructive'}
                onClick={toggleCamera}
                className={cn(
                  'h-12 w-12 rounded-full',
                  isCameraOn
                    ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    : 'bg-red-500 hover:bg-red-600 text-white'
                )}
              >
                {isCameraOn ? (
                  <Video className="h-6 w-6" />
                ) : (
                  <VideoOff className="h-6 w-6" />
                )}
              </Button>
              <Button
                size="icon"
                variant="secondary"
                onClick={handleJoin}
                disabled={isBusy}
                className="h-12 w-12 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700"
              >
                <RefreshCw className="h-6 w-6" />
              </Button>
              <Button
                size="icon"
                variant="destructive"
                onClick={handleLeave}
                className="h-12 w-12 rounded-full bg-red-500 hover:bg-red-600 text-white"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
          </>
        )}
      </div>

      <audio ref={audioElementRef} className="hidden" />
    </div>
  );
};
