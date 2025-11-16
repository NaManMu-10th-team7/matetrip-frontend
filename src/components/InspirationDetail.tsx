import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { Map as KakaoMap, MapMarker } from 'react-kakao-maps-sdk';
import { Button } from './ui/button';
import { InspirationCard } from './InspirationCard';
// import client from '../api/client';

// 장소 상세 정보 타입
interface PlaceDetail {
  id: string;
  title: string;
  address: string;
  imageUrl?: string;
  summary?: string;
  latitude?: number;
  longitude?: number;
}

// 주변 장소 타입
interface NearbyPlace {
  id: string;
  title: string;
  address: string;
  imageUrl?: string;
}

export function InspirationDetail() {
  const { placeId } = useParams<{ placeId: string }>();
  const navigate = useNavigate();

  const [placeDetail, setPlaceDetail] = useState<PlaceDetail | null>(null);
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState({ lat: 37.5665, lng: 126.978 }); // 기본값: 서울

  useEffect(() => {
    const fetchPlaceDetail = async () => {
      if (!placeId) return;

      setIsLoading(true);
      try {
        /*
         * TODO: 백엔드에서 장소 상세 정보 API 구현 후 활성화
         * API 엔드포인트: GET /places/{placeId}
         *
         * 필요한 응답 데이터:
         * - id: string (장소 고유 ID)
         * - title: string (장소명)
         * - address: string (장소 주소)
         * - image_url?: string (장소 이미지 URL)
         * - summary?: string (장소 소개/설명)
         * - latitude: number (위도)
         * - longitude: number (경도)
         *
         * const response = await client.get<PlaceDetail>(`/places/${placeId}`);
         * setPlaceDetail(response.data);
         */

        // 임시 더미 데이터 (API 구현 전까지 사용)
        const dummyDetail: PlaceDetail = {
          id: placeId,
          title: '서울 그랜드 호텔',
          address: '서울특별시 강남구 테헤란로 123',
          imageUrl: undefined,
          summary:
            '서울의 중심부에 위치한 럭셔리 호텔입니다. 최고급 시설과 서비스를 제공하며, 비즈니스와 관광객 모두에게 완벽한 숙박 경험을 선사합니다.',
          latitude: 37.5665,
          longitude: 126.978,
        };
        setPlaceDetail(dummyDetail);

        // 지도 중심 설정
        if (dummyDetail.latitude && dummyDetail.longitude) {
          setMapCenter({
            lat: dummyDetail.latitude,
            lng: dummyDetail.longitude,
          });
        }

        /*
         * TODO: 주변 장소 API 호출
         * API 엔드포인트: GET /places/nearby
         *
         * 필요한 요청 파라미터:
         * - latitude: number (현재 장소의 위도)
         * - longitude: number (현재 장소의 경도)
         * - limit: number (가져올 장소 개수, 기본 4개)
         *
         * 필요한 응답 데이터 (배열):
         * - id: string (장소 고유 ID)
         * - title: string (장소명)
         * - address: string (장소 주소)
         * - image_url?: string (장소 이미지 URL)
         *
         * const nearbyResponse = await client.get<NearbyPlace[]>('/places/nearby', {
         *   params: {
         *     latitude: dummyDetail.latitude,
         *     longitude: dummyDetail.longitude,
         *     limit: 4,
         *   },
         * });
         * setNearbyPlaces(nearbyResponse.data);
         */

        // 임시 주변 장소 더미 데이터
        const dummyNearby: NearbyPlace[] = [
          {
            id: '2',
            title: '강남역 카페거리',
            address: '서울특별시 강남구 강남대로',
          },
          {
            id: '3',
            title: '코엑스몰',
            address: '서울특별시 강남구 영동대로 513',
          },
          {
            id: '4',
            title: '봉은사',
            address: '서울특별시 강남구 봉은사로 531',
          },
          {
            id: '5',
            title: '삼성동 맛집거리',
            address: '서울특별시 강남구 삼성동',
          },
        ];
        setNearbyPlaces(dummyNearby);
      } catch (error) {
        console.error('Failed to fetch place detail:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlaceDetail();
  }, [placeId]);

  const handlePlanTrip = () => {
    // CreatePostModal로 라우팅 (장소 정보 전달: 이름, 주소, 좌표)
    navigate('/create-post', {
      state: {
        placeId: placeDetail?.id,
        placeName: placeDetail?.title,
        placeAddress: placeDetail?.address,
        placeLatitude: placeDetail?.latitude,
        placeLongitude: placeDetail?.longitude,
      },
    });
  };

  const handleNearbyPlaceClick = (nearbyPlaceId: string) => {
    navigate(`/inspiration/${nearbyPlaceId}`);
  };

  if (isLoading) {
    return (
      <div className="bg-gray-50 min-h-screen flex">
        {/* 메인 콘텐츠 로딩 스켈레톤 */}
        <div className="w-full lg:w-[576px] bg-white border-r border-gray-200">
          <div className="animate-pulse">
            <div className="bg-gray-300 h-[490px] rounded-b-xl"></div>
            <div className="p-8">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
        {/* 지도 영역 */}
        <div className="hidden lg:flex flex-1 bg-gray-100 items-center justify-center">
          <div className="text-gray-500">지도 로딩 중...</div>
        </div>
      </div>
    );
  }

  if (!placeDetail) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-gray-500">장소 정보를 찾을 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 h-screen flex">
      {/* 메인 콘텐츠 영역 */}
      <div className="lg:w-[776px] bg-white border-r border-gray-200 overflow-y-auto h-full">
        {/* 상단 이미지 및 장소 정보 */}
        <div
          className="relative h-[490px] rounded-b-xl bg-cover bg-center flex flex-col justify-end p-8"
          style={{
            backgroundColor: placeDetail.imageUrl
              ? undefined
              : 'rgb(209 213 219)',
            backgroundImage: placeDetail.imageUrl
              ? `url(${placeDetail.imageUrl})`
              : undefined,
          }}
        >
          <div className="text-white">
            <h1 className="text-2xl font-medium leading-[1.4] mb-3">
              {placeDetail.title}
            </h1>
            <p className="text-base font-medium leading-[1.6] mb-3">
              {placeDetail.address}
            </p>
          </div>
          <Button
            onClick={handlePlanTrip}
            className="w-fit bg-white text-black hover:bg-gray-100 rounded-full px-6 py-2 text-lg font-medium"
          >
            여행을 계획하세요.
          </Button>
        </div>

        {/* 소개 섹션 */}
        <div className="p-8 border-b border-gray-200">
          <h2 className="text-lg font-medium leading-[1.5] mb-3">소개</h2>
          <p className="text-sm text-black leading-5">
            {placeDetail.summary || '장소에 대한 소개 정보가 없습니다.'}
          </p>
        </div>

        {/* 근처의 다른 장소들 섹션 */}
        <div className="p-8">
          <h2 className="text-sm font-normal leading-5 mb-4">
            근처의 다른 장소들 입니다.
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {nearbyPlaces.map((place) => (
              <div
                key={place.id}
                className="cursor-pointer"
                onClick={() => handleNearbyPlaceClick(place.id)}
              >
                <InspirationCard
                  imageUrl={place.imageUrl}
                  badgeText=""
                  title={place.title}
                  address={place.address}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* 지도 영역 (데스크탑에서만 표시) */}
      <div className="hidden lg:flex flex-1 bg-gray-100 relative h-full">
        {placeDetail.latitude && placeDetail.longitude ? (
          <KakaoMap
            center={mapCenter}
            style={{ width: '100%', height: '100%' }}
            level={3}
          >
            <MapMarker
              position={{
                lat: placeDetail.latitude,
                lng: placeDetail.longitude,
              }}
            />
          </KakaoMap>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center">
            <MapPin className="w-16 h-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              지도 뷰
            </h3>
            <p className="text-base text-gray-500">
              여행지를 지도에서 확인하세요
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
