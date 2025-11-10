import { useEffect, useRef, useState } from 'react';
import type { Poi, CreatePoiDto } from '../hooks/usePoiSocket';

export interface KakaoPlace {
  id: string;
  place_name: string;
  category_name: string;
  category_group_code: string;
  category_group_name: string;
  phone: string;
  address_name: string;
  road_address_name: string;
  x: string;
  y: string;
  place_url: string;
  distance: string;
}

export interface DayLayer {
  id: string;
  label: string;
  color: string;
}

interface MapPanelProps {
  itinerary: Record<string, Poi[]>;
  dayLayers: DayLayer[];
  pois: Poi[];
  isSyncing: boolean;
  markPoi: (poiData: Omit<CreatePoiDto, 'workspaceId' | 'createdBy' | 'id'>) => void;
  unmarkPoi: (poiId: string | number) => void;
  selectedPlace: KakaoPlace | null;
  mapRef: React.RefObject<kakao.maps.Map>;
}

export function MapPanel({
  itinerary,
  dayLayers,
  pois,
  isSyncing,
  markPoi,
  unmarkPoi,
  selectedPlace,
  mapRef,
}: MapPanelProps) {
  const [map, setMap] = useState<kakao.maps.Map | null>(null);
  const [markers, setMarkers] = useState<kakao.maps.Marker[]>([]);
  const [polylines, setPolylines] = useState<kakao.maps.Polyline[]>([]);
  const [infoWindow, setInfoWindow] = useState<kakao.maps.InfoWindow | null>(null);

  // 지도 초기화
  useEffect(() => {
    const container = document.getElementById('map');
    if (container && !map) {
      const options = {
        center: new window.kakao.maps.LatLng(33.450701, 126.570667),
        level: 3,
      };
      const newMap = new window.kakao.maps.Map(container, options);
      if (mapRef) {
        (mapRef as React.MutableRefObject<kakao.maps.Map>).current = newMap;
      }
      setMap(newMap);
      setInfoWindow(new window.kakao.maps.InfoWindow({ zIndex: 1 }));
    }
  }, [map, mapRef]);

  // 지도 클릭 이벤트 핸들러
  useEffect(() => {
    if (!map) return;

    const clickListener = (mouseEvent: kakao.maps.event.MouseEvent) => {
      const latlng = mouseEvent.latLng;
      const geocoder = new window.kakao.maps.services.Geocoder();
      const places = new window.kakao.maps.services.Places(); // Instantiate Places service

      geocoder.coord2Address(latlng.getLng(), latlng.getLat(), (result, status) => {
        if (status === window.kakao.maps.services.Status.OK) {
          const address = result[0].road_address?.address_name || result[0].address.address_name;

          // Perform a keyword search around the clicked location
          places.keywordSearch(
            address, // Use the address as the search keyword
            (data, searchStatus) => {
              let placeName = address; // Default to address if no place found
              let categoryName: string | undefined = undefined;

              if (searchStatus === window.kakao.maps.services.Status.OK && data.length > 0) {
                const place = data[0];
                placeName = place.place_name;
                categoryName = place.category_name;
              }

              markPoi({
                latitude: latlng.getLat(),
                longitude: latlng.getLng(),
                address: address,
                categoryName: categoryName,
                placeName: placeName,
              });
            },
            {
              location: latlng,
              radius: 50, // Search within a 50m radius
              sort: window.kakao.maps.services.SortBy?.DISTANCE,
            }
          );
        }
      });
    };

    window.kakao.maps.event.addListener(map, 'click', clickListener);

    return () => {
      window.kakao.maps.event.removeListener(map, 'click', clickListener);
    };
  }, [map, markPoi]);

  // 마커 및 폴리라인 업데이트
  useEffect(() => {
    if (!map || !infoWindow) return;

    // 기존 마커/폴리라인 제거
    markers.forEach((marker) => marker.setMap(null));
    polylines.forEach((line) => line.setMap(null));

    const newMarkers: kakao.maps.Marker[] = [];
    const newPolylines: kakao.maps.Polyline[] = [];

    // POI 마커 생성
    pois.forEach((poi) => {
      const position = new window.kakao.maps.LatLng(poi.latitude, poi.longitude);
      const marker = new window.kakao.maps.Marker({ position });
      marker.setMap(map);
      newMarkers.push(marker);

      const content = `<div style="padding:5px;font-size:12px;">${poi.placeName}</div>`;
      
      // Add mouseover event to show info window
      window.kakao.maps.event.addListener(marker, 'mouseover', () => {
        infoWindow.setContent(content);
        infoWindow.open(map, marker);
      });

      // Add mouseout event to close info window
      window.kakao.maps.event.addListener(marker, 'mouseout', () => {
        infoWindow.close();
      });

      // Keep click event for consistency or other actions
      window.kakao.maps.event.addListener(marker, 'click', () => {
        infoWindow.setContent(content);
        infoWindow.open(map, marker);
      });
    });

    // 일정 폴리라인 생성
    dayLayers.forEach((layer) => {
      const path = (itinerary[layer.id] || [])
        .map((poi) => new window.kakao.maps.LatLng(poi.latitude, poi.longitude));
      
      if (path.length > 1) {
        const polyline = new window.kakao.maps.Polyline({
          path: path,
          strokeWeight: 3,
          strokeColor: layer.color,
          strokeOpacity: 0.8,
          strokeStyle: 'solid',
        });
        polyline.setMap(map);
        newPolylines.push(polyline);
      }
    });

    setMarkers(newMarkers);
    setPolylines(newPolylines);

  }, [map, pois, itinerary, dayLayers, infoWindow]);

  // 선택된 장소 처리
  useEffect(() => {
    if (selectedPlace && map) {
      const position = new window.kakao.maps.LatLng(Number(selectedPlace.y), Number(selectedPlace.x));
      map.panTo(position);
      markPoi({
        latitude: Number(selectedPlace.y),
        longitude: Number(selectedPlace.x),
        address: selectedPlace.road_address_name || selectedPlace.address_name,
        placeName: selectedPlace.place_name,
        categoryName: selectedPlace.category_name,
      });
    }
  }, [selectedPlace, map, markPoi]);

  return (
    <div id="map" style={{ width: '100%', height: '100%' }}>
      {isSyncing && (
        <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'white', padding: '10px', borderRadius: '5px', zIndex: 2 }}>
          데이터 동기화 중...
        </div>
      )}
    </div>
  );
}
