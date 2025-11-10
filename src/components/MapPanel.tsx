import { useEffect, useRef, useState, memo } from 'react';
import type { Poi, CreatePoiDto } from '../hooks/usePoiSocket';
import { Map, MapMarker, CustomOverlayMap, Polyline } from 'react-kakao-maps-sdk';

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
  markPoi: (
    poiData: Omit<CreatePoiDto, 'workspaceId' | 'createdBy' | 'id'>
  ) => void;
  unmarkPoi: (poiId: string | number) => void;
  selectedPlace: KakaoPlace | null;
  mapRef: React.RefObject<kakao.maps.Map>;
  onPoiDragEnd: (poiId: string, lat: number, lng: number) => void; // New prop
}

interface PoiMarkerProps {
  poi: Poi;
  onPoiDragEnd: (poiId: string, lat: number, lng: number) => void;
}

const PoiMarker = memo(({ poi, onPoiDragEnd }: PoiMarkerProps) => {
  const [isInfoWindowOpen, setIsInfoWindowOpen] = useState(false);
  const infoWindowTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseOver = () => {
    if (infoWindowTimeoutRef.current) {
      clearTimeout(infoWindowTimeoutRef.current);
      infoWindowTimeoutRef.current = null;
    }
    setIsInfoWindowOpen(true);
  };

  const handleMouseOut = () => {
    infoWindowTimeoutRef.current = setTimeout(() => {
      setIsInfoWindowOpen(false);
    }, 100); // 100ms 지연
  };

  const handleClick = () => {
    if (infoWindowTimeoutRef.current) {
      clearTimeout(infoWindowTimeoutRef.current);
      infoWindowTimeoutRef.current = null;
    }
    setIsInfoWindowOpen(true);
  };

  return (
    <MapMarker
      position={{ lat: poi.latitude, lng: poi.longitude }}
      draggable={true}
      onMouseOver={handleMouseOver}
      onMouseOut={handleMouseOut}
      onClick={handleClick}
      onDragEnd={(marker) => {
        const newPosition = marker.getPosition();
        onPoiDragEnd(poi.id, newPosition.getLat(), newPosition.getLng());
      }}
    >
      {isInfoWindowOpen && (
        <CustomOverlayMap
          position={{ lat: poi.latitude, lng: poi.longitude }}
          xAnchor={0.5}
          yAnchor={1.5}   // Changed from 1.2 to 1.5
          zIndex={1}
        >
          <div
            onMouseOver={handleMouseOver}
            onMouseOut={handleMouseOut}
            style={{
              padding: '10px',
              backgroundColor: '#fff',
              borderRadius: '8px',
              boxShadow: '0 6px 20px rgba(0, 0, 0, 0.3)',
              minWidth: '180px',
              maxWidth: '400px',
              whiteSpace: 'normal',
              lineHeight: '1.5',
              textAlign: 'left',
              boxSizing: 'border-box',
              display: 'block',
            }}
          >
            <div
              style={{
                fontWeight: 'bold',
                fontSize: '16px',
                marginBottom: '5px',
                color: '#333',
                textAlign: 'center',
              }}
            >
              {poi.placeName}
            </div>
            <div
              style={{
                fontSize: '13px',
                color: '#666',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {poi.address}
            </div>
          </div>
        </CustomOverlayMap>
      )}
    </MapMarker>
  );
});

export function MapPanel({
  itinerary,
  dayLayers,
  pois,
  isSyncing,
  markPoi,
  unmarkPoi,
  selectedPlace,
  mapRef,
  onPoiDragEnd, // Destructure new prop
}: MapPanelProps) {
  // 선택된 장소 처리
  useEffect(() => {
    if (selectedPlace && mapRef.current) {
      const position = new window.kakao.maps.LatLng(
        Number(selectedPlace.y),
        Number(selectedPlace.x)
      );
      mapRef.current.panTo(position);
      const poiData = {
        latitude: Number(selectedPlace.y),
        longitude: Number(selectedPlace.x),
        address: selectedPlace.road_address_name || selectedPlace.address_name,
        placeName: selectedPlace.place_name,
        categoryName: selectedPlace.category_name,
      };
      console.log(
        'Selected place changed: Calling markPoi with data:',
        poiData
      );
      markPoi(poiData);
    }
  }, [selectedPlace, mapRef, markPoi]);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Map
        center={{ lat: 33.450701, lng: 126.570667 }} // Initial center
        style={{ width: '100%', height: '100%' }}
        level={3}
        onLoad={(map) => {
          if (mapRef) {
            (mapRef as React.MutableRefObject<kakao.maps.Map>).current = map;
          }
        }}
        onClick={(_map, mouseEvent) => {
          const latlng = mouseEvent.latLng;
          const geocoder = new window.kakao.maps.services.Geocoder();
          const places = new window.kakao.maps.services.Places();

          geocoder.coord2Address(
            latlng.getLng(),
            latlng.getLat(),
            (result, status) => {
              if (status === window.kakao.maps.services.Status.OK) {
                const address =
                  result[0].road_address?.address_name ||
                  result[0].address.address_name;

                places.keywordSearch(
                  address,
                  (data, searchStatus) => {
                    let placeName = address;
                    let categoryName: string | undefined = undefined;

                    if (
                      searchStatus === window.kakao.maps.services.Status.OK &&
                      data.length > 0
                    ) {
                      const place = data[0];
                      placeName = place.place_name;
                      categoryName = place.category_name;
                    }

                    const poiData = {
                      latitude: latlng.getLat(),
                      longitude: latlng.getLng(),
                      address: address,
                      categoryName: categoryName,
                      placeName: placeName,
                    };
                    console.log(
                      'Map click event: Calling markPoi with data:',
                      poiData
                    );
                    markPoi(poiData);
                  },
                  {
                    location: latlng,
                    radius: 50,
                    sort: window.kakao.maps.services.SortBy?.DISTANCE,
                  }
                );
              }
            }
          );
        }}
      >
        {pois.map((poi) => (
          <PoiMarker key={poi.id} poi={poi} onPoiDragEnd={onPoiDragEnd} />
        ))}

        {dayLayers.map((layer) => {
          const path = (itinerary[layer.id] || []).map((poi) => ({
            lat: poi.latitude,
            lng: poi.longitude,
          }));

          return path.length > 1 ? (
            <Polyline
              key={layer.id}
              path={path}
              strokeWeight={3}
              strokeColor={layer.color}
              strokeOpacity={0.8}
              strokeStyle={'solid'}
            />
          ) : null;
        })}
      </Map>

      {isSyncing && (
        <div
          style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            background: 'white',
            padding: '10px',
            borderRadius: '5px',
            zIndex: 2,
          }}
        >
          데이터 동기화 중...
        </div>
      )}
    </div>
  );
}
