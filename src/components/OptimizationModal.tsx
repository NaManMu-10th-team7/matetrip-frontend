
import React from 'react';

interface PathPoint {
  name: string;
  // 경로 지점에 대한 다른 데이터가 있다면 여기에 추가할 수 있습니다.
  // 예: lat: number, lng: number
}

interface PathData {
  path: PathPoint[];
  distance: number; // 미터 단위
  duration: number; // 초 단위
}

interface OptimizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalPath: PathData | null;
  optimizedPath: PathData | null;
  isOptimizing: boolean;
}

const OptimizationModal: React.FC<OptimizationModalProps> = ({
  isOpen,
  onClose,
  originalPath,
  optimizedPath,
  isOptimizing,
}) => {
  if (!isOpen) {
    return null;
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}시간 ${minutes}분`;
  };

  const formatDistance = (meters: number) => {
    return `${(meters / 1000).toFixed(2)} km`;
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <button onClick={onClose} style={styles.closeButton}>&times;</button>
        <h2 style={styles.header}>경로 최적화 결과</h2>
        <div style={styles.content}>
          <div style={styles.panel}>
            <h3 style={styles.panelHeader}>기존 경로</h3>
            {originalPath ? (
              <>
                <p>총 거리: {formatDistance(originalPath.distance)}</p>
                <p>총 소요 시간: {formatDuration(originalPath.duration)}</p>
                <h4 style={styles.pathHeader}>경로 순서</h4>
                <ol style={styles.pathList}>
                  {originalPath.path.map((point, index) => (
                    <li key={index}>{point.name || `경유지 ${index + 1}`}</li>
                  ))}
                </ol>
              </>
            ) : (
              <p>기존 경로 정보가 없습니다.</p>
            )}
          </div>
          <div style={styles.panel}>
            <h3 style={styles.panelHeader}>최적화된 경로</h3>
            {isOptimizing ? (
              <div style={styles.loadingContainer}>
                <p>최적화 중입니다...</p>
                {/* 간단한 로딩 스피너 */}
                <div style={styles.spinner}></div>
              </div>
            ) : optimizedPath ? (
              <>
                <p>총 거리: {formatDistance(optimizedPath.distance)}</p>
                <p>총 소요 시간: {formatDuration(optimizedPath.duration)}</p>
                <h4 style={styles.pathHeader}>경로 순서</h4>
                <ol style={styles.pathList}>
                  {optimizedPath.path.map((point, index) => (
                    <li key={index}>{point.name || `경유지 ${index + 1}`}</li>
                  ))}
                </ol>
                {originalPath && (
                    <div style={styles.summary}>
                        <h4>개선 효과</h4>
                        <p style={styles.summaryText}>
                            거리 단축: {formatDistance(originalPath.distance - optimizedPath.distance)}
                        </p>
                        <p style={styles.summaryText}>
                            시간 단축: {formatDuration(originalPath.duration - optimizedPath.duration)}
                        </p>
                    </div>
                )}
              </>
            ) : (
              <p>최적화된 경로를 불러오지 못했습니다.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// CSS-in-JS 스타일 정의
const styles: { [key: string]: React.CSSProperties } = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    modal: {
        background: 'white',
        padding: '25px',
        borderRadius: '10px',
        width: '90%',
        maxWidth: '800px',
        position: 'relative',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    },
    closeButton: {
        position: 'absolute',
        top: '15px',
        right: '15px',
        background: 'transparent',
        border: 'none',
        fontSize: '1.8rem',
        cursor: 'pointer',
        color: '#333',
    },
    header: {
        textAlign: 'center',
        marginBottom: '20px',
    },
    content: {
        display: 'flex',
        justifyContent: 'space-around',
        gap: '20px',
    },
    panel: {
        width: '48%',
        padding: '15px',
        border: '1px solid #ddd',
        borderRadius: '8px',
        backgroundColor: '#f9f9f9',
    },
    panelHeader: {
        marginTop: 0,
        borderBottom: '2px solid #eee',
        paddingBottom: '10px',
        marginBottom: '15px',
    },
    pathHeader: {
        marginTop: '20px',
        marginBottom: '10px',
    },
    pathList: {
        paddingLeft: '20px',
    },
    summary: {
        marginTop: '20px',
        paddingTop: '15px',
        borderTop: '1px solid #ddd',
    },
    summaryText: {
        color: '#28a745',
        fontWeight: 'bold',
    },
    loadingContainer: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
    },
    spinner: {
        border: '4px solid #f3f3f3',
        borderTop: '4px solid #3498db',
        borderRadius: '50%',
        width: '40px',
        height: '40px',
        animation: 'spin 1s linear infinite',
        marginTop: '20px',
    },
};

// keyframes를 스타일 시트에 동적으로 추가
const styleSheet = document.styleSheets[0];
if (styleSheet) {
    const keyframes = `@keyframes spin {
        0% { transform: 'rotate(0deg)' }
        100% { transform: 'rotate(360deg)' }
    }`;
    try {
        styleSheet.insertRule(keyframes, styleSheet.cssRules.length);
    } catch (e) {
        console.error("Could not insert keyframes rule:", e);
    }
}


export default OptimizationModal;
