import { useState, useEffect } from 'react';
import client from '../api/client';

// 장소 상세 정보 타입
export interface PlaceDetail {
  id: string;
  title: string;
  address: string;
  category?: string;
  imageUrl?: string;
  summary?: string;
  latitude?: number;
  longitude?: number;
}

// 주변 장소 타입
export interface NearbyPlace {
  id: string;
  title: string;
  address: string;
  category?: string;
  imageUrl?: string;
  latitude?: number;
  longitude?: number;
}

// 백엔드 API 응답 타입 (GET /places/{placeId})
interface PlaceApiResponse {
  id: string;
  category: string;
  title: string;
  address: string;
  summary?: string;
  image_url?: string;
  longitude: number;
  latitude: number;
}

// 주변 장소 API 응답 타입
interface NearbyPlaceApiResponse {
  id: string;
  category: string;
  title: string;
  address: string;
  summary?: string;
  image_url?: string;
  longitude: number;
  latitude: number;
}

// 장소 + 주변 장소 통합 API 응답 타입 (GET /places/{placeId}/with-nearby)
interface PlaceWithNearbyApiResponse {
  place: PlaceApiResponse;
  nearbyPlaces: NearbyPlaceApiResponse[];
}

interface UsePlaceDetailResult {
  placeDetail: PlaceDetail | null;
  nearbyPlaces: NearbyPlace[];
  isLoading: boolean;
  error: Error | null;
}

export const usePlaceDetail = (placeId?: string | null): UsePlaceDetailResult => {
  const [placeDetail, setPlaceDetail] = useState<PlaceDetail | null>(null);
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchPlaceDetail = async () => {
      if (!placeId) {
        setPlaceDetail(null);
        setNearbyPlaces([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      setPlaceDetail(null); // 이전 상태 초기화
      setNearbyPlaces([]); // 이전 상태 초기화

      try {
        const response = await client.get<PlaceWithNearbyApiResponse>(
          `/places/${placeId}/with-nearby`
        );
        const { place: apiData, nearbyPlaces: nearbyPlacesData } = response.data;

        const updatedDetail: PlaceDetail = {
          id: apiData.id,
          title: apiData.title,
          address: apiData.address,
          category: apiData.category,
          imageUrl: apiData.image_url,
          summary: apiData.summary,
          latitude: apiData.latitude,
          longitude: apiData.longitude,
        };
        setPlaceDetail(updatedDetail);

        const formattedNearbyPlaces: NearbyPlace[] = nearbyPlacesData.map(
          (nearby) => ({
            id: nearby.id,
            title: nearby.title,
            address: nearby.address,
            category: nearby.category,
            imageUrl: nearby.image_url,
            latitude: nearby.latitude,
            longitude: nearby.longitude,
          })
        );
        setNearbyPlaces(formattedNearbyPlaces);
      } catch (err) {
        console.error('Failed to fetch place detail:', err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlaceDetail();
  }, [placeId]);

  return { placeDetail, nearbyPlaces, isLoading, error };
};
