import { useState } from 'react';
import {
  GripVertical,
  Trash2,
  Save,
  MapPin,
  Clock,
  Car,
  ArrowRight,
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import type { Poi } from '../hooks/usePoiSocket';
import type { DayLayer } from './MapPanel';

interface PlanPanelProps {
  itinerary: Record<string, Poi[]>;
  dayLayers: DayLayer[];
}

const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}시간 ${minutes}분`;
  }
  return `${minutes}분`;
};

const formatDistance = (meters: number) => {
  if (meters > 1000) {
    return `${(meters / 1000).toFixed(1)}km`;
  }
  return `${meters}m`;
};

export function PlanPanel({ itinerary, dayLayers }: PlanPanelProps) {
  const [selectedDay, setSelectedDay] = useState<string>(dayLayers[0]?.id);

  return (
    <div className="h-full flex flex-col bg-white">
      <Tabs
        value={selectedDay}
        onValueChange={(v) => setSelectedDay(v)}
        className="flex-1 flex flex-col"
      >
        <TabsList className="bg-gray-100 m-4 mb-0">
          {dayLayers.map((layer, index) => (
            <TabsTrigger key={layer.id} value={layer.id} className="flex-1">
              Day {index + 1}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="flex-1 overflow-y-auto p-4">
          {dayLayers.map((layer) => (
            <TabsContent key={layer.id} value={layer.id} className="m-0">
              <div className="space-y-3">
                {(itinerary[layer.id] || []).map((poi, index) => (
                  <div key={poi.id}>
                    {index > 0 && (
                      <div className="flex items-center justify-center gap-2 my-2 text-xs text-gray-500">
                        <Car className="w-3 h-3" />
                        <span>
                          {poi.distance
                            ? formatDistance(poi.distance)
                            : '거리 정보 없음'}
                        </span>
                        <ArrowRight className="w-3 h-3" />
                        <Clock className="w-3 h-3" />
                        <span>
                          {poi.duration
                            ? formatDuration(poi.duration)
                            : '시간 정보 없음'}
                        </span>
                      </div>
                    )}
                    <div className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-3">
                        <button className="mt-1 cursor-grab active:cursor-grabbing">
                          <GripVertical className="w-5 h-5 text-gray-400" />
                        </button>

                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">{index + 1}</Badge>
                              <h4 className="text-gray-900">{poi.placeName}</h4>
                            </div>
                            <button className="p-2 hover:bg-gray-100 rounded transition-colors">
                              <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-600" />
                            </button>
                          </div>

                          <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              <span>{poi.address}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {(itinerary[layer.id] || []).length === 0 && (
                <div
                  className="text-center py-12 text-gray-500"
                >
                  <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>아직 일정이 없습니다</p>
                  <p className="text-sm">지도에서 장소를 추가해보세요</p>
                </div>
              )}
            </TabsContent>
          ))}
        </div>
      </Tabs>

      {/* Footer */}
      <div className="border-t p-4">
        <Button className="w-full gap-2 bg-blue-600 hover:bg-blue-700">
          <Save className="w-4 h-4" />
          일정 저장
        </Button>
      </div>
    </div>
  );
}
