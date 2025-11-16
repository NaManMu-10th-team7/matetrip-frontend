import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from './ui/dialog';
import { Button } from './ui/button';
import { type DayLayer } from '../types/map';
import { useState, useEffect } from 'react';

interface AddToItineraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  dayLayers: DayLayer[];
  onConfirm: (targetDayId: string) => void;
  poiName?: string;
}

export function AddToItineraryModal({
  isOpen,
  onClose,
  dayLayers,
  onConfirm,
  poiName,
}: AddToItineraryModalProps) {
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);

  useEffect(() => {
    // 모달이 열릴 때 첫 번째 날짜를 기본값으로 선택
    if (isOpen && dayLayers.length > 0) {
      setSelectedDayId(dayLayers[0].id);
    } else if (!isOpen) {
      setSelectedDayId(null); // 모달이 닫히면 선택 초기화
    }
  }, [isOpen, dayLayers]);

  const handleConfirm = () => {
    if (selectedDayId) {
      onConfirm(selectedDayId);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>어느 날짜에 추가할까요?</DialogTitle>
          <DialogDescription>
            '{poiName}' 장소를 추가할 여행 날짜를 선택해주세요.
          </DialogDescription>
        </DialogHeader>
        <div className="my-4 space-y-2">
          {dayLayers.map((day) => (
            <Button
              key={day.id}
              variant={selectedDayId === day.id ? 'default' : 'outline'}
              className="w-full justify-start"
              onClick={() => setSelectedDayId(day.id)}
            >
              {day.label}
            </Button>
          ))}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            취소
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedDayId}>
            일정에 추가
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
