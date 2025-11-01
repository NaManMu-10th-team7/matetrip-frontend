import { useState } from 'react';
import { GripVertical, Trash2, Save, MapPin, Clock, Car } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

const MOCK_PLAN = {
  day1: [
    {
      id: 1,
      name: '성산일출봉',
      time: '09:00',
      duration: '2시간',
      distance: '0km',
    },
    {
      id: 2,
      name: '우도',
      time: '12:00',
      duration: '3시간',
      distance: '5km (차량 15분)',
    },
    {
      id: 3,
      name: '협재 해수욕장',
      time: '16:00',
      duration: '2시간',
      distance: '45km (차량 1시간)',
    },
  ],
  day2: [
    {
      id: 4,
      name: '한라산 등반',
      time: '07:00',
      duration: '5시간',
      distance: '30km (차량 40분)',
    },
    {
      id: 5,
      name: '카페 투어',
      time: '14:00',
      duration: '2시간',
      distance: '10km (차량 20분)',
    },
  ],
};

export function PlanPanel() {
  const [selectedDay, setSelectedDay] = useState<'day1' | 'day2'>('day1');
  const currentPlan = MOCK_PLAN[selectedDay];

  return (
    <div className="h-full flex flex-col bg-white">
      <Tabs
        value={selectedDay}
        onValueChange={(v) => setSelectedDay(v as 'day1' | 'day2')}
        className="flex-1 flex flex-col"
      >
        <TabsList className="bg-gray-100 m-4 mb-0">
          <TabsTrigger value="day1" className="flex-1">
            Day 1
          </TabsTrigger>
          <TabsTrigger value="day2" className="flex-1">
            Day 2
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto p-4">
          <TabsContent value={selectedDay} className="m-0">
            <div className="space-y-3">
              {currentPlan.map((place, index) => (
                <div
                  key={place.id}
                  className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    <button className="mt-1 cursor-grab active:cursor-grabbing">
                      <GripVertical className="w-5 h-5 text-gray-400" />
                    </button>

                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{index + 1}</Badge>
                          <h4 className="text-gray-900">{place.name}</h4>
                        </div>
                        <button className="p-2 hover:bg-gray-100 rounded transition-colors">
                          <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-600" />
                        </button>
                      </div>

                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>
                            {place.time} ({place.duration})
                          </span>
                        </div>
                        {index > 0 && (
                          <div className="flex items-center gap-2">
                            <Car className="w-4 h-4" />
                            <span>{place.distance}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {currentPlan.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>아직 일정이 없습니다</p>
                <p className="text-sm">지도에서 장소를 추가해보세요</p>
              </div>
            )}
          </TabsContent>
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
