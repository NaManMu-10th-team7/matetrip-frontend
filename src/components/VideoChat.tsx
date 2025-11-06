import { useEffect, useRef, useState } from 'react';
import { OpenVidu, StreamEvent, StreamManager } from 'openvidu-browser';

interface Props {
  workspaceId: string;
}

// 개별 비디오 박스를 렌더링하는 컴포넌트
interface StreamVideoProps {
  streamManager: StreamManager;
  isLocal: boolean; // 내 영상인지 다른 사람 영상인지 구분용 (muted 여부)
}

function StreamVideo({ streamManager, isLocal }: StreamVideoProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    //  StreamManager가 가지고 있는 stream(영상)을 video element에 연결
    // => WebRTC로 전달받은 영상을 실제 DOM에 붙이는 과정
    if (videoRef.current) {
      streamManager.addVideoElement(videoRef.current);
    }
  }, [streamManager]);

  return (
    <video
      ref={videoRef}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        background: 'black',
      }}
      autoPlay //자동재생
      playsInline
      muted={isLocal} //본인꺼는 본인송출에 mute
    />
  );
}

export default function VideoChat({ workspaceId }: Props) {
  const [publisher, setPublisher] = useState<StreamManager | null>(null);
  const [subscribers, setSubscribers] = useState<StreamManager[]>([]);

  const joinSession = async () => {
    //  1) Nest 서버에서 token 받아오기
    const res = await fetch('http://localhost:3000/openvidu/chatstart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceId }),
    });

    const { token } = await res.json();

    // 2) OpenVidu 객체 생성
    const OV = new OpenVidu();
    const newSession = OV.initSession();

    // 원격 참가자가 새 스트림을 게시할 때마다 올라오는 이벤트 => 다른 사람이 방에 들어오면 영상 추가
    newSession.on('streamCreated', (event: StreamEvent) => {
      const subscriber = newSession.subscribe(event.stream, undefined);
      setSubscribers((prev) => [...prev, subscriber]);
    });

    // 누군가 방을 나갈 때 실행되는 이벤트  => subscribers 목록에서 제거
    newSession.on('streamDestroyed', (event: StreamEvent) => {
      const streamManager = event.stream.streamManager as StreamManager;
      setSubscribers((prev) => prev.filter((sub) => sub !== streamManager));
    });

    //  3) 세션에 연결 (token 필요)
    await newSession.connect(token);

    //   5) 내 카메라/마이크 스트림 생성
    const publisher = await OV.initPublisherAsync(undefined, {
      videoSource: true,
      audioSource: true, //마이크
      publishVideo: true,
      publishAudio: true,
      resolution: '1280x720', //해상도
    });

    //  5) 세션에 스트림 publish (상대방에게 전달)
    newSession.publish(publisher);

    setPublisher(publisher);
  };
  //참가자 수에 맞춰 그리드의 가로·세로 칸 수를 동적 계산
  const participants = publisher ? [publisher, ...subscribers] : subscribers;
  const participantCount = participants.length || 1;
  const columns =
    participantCount === 1
      ? 1
      : participantCount === 2
        ? 2
        : participantCount <= 4
          ? 2
          : Math.ceil(Math.sqrt(participantCount));
  const rows = Math.ceil(participantCount / columns);

  return (
    <div>
      <button onClick={joinSession}>화상 참여하기</button>

      {/*  이 div에 WebRTC 영상이 들어가게 됨 */}
      <div
        style={{
          display: 'grid',
          width: 600,
          height: 240,
          background: 'black',
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`,
          gap: 8,
        }}
      >
        {participants.map((streamManager) => (
          <StreamVideo
            key={streamManager.stream.streamId}
            streamManager={streamManager}
            isLocal={streamManager === publisher}
          />
        ))}
      </div>
    </div>
  );
}
