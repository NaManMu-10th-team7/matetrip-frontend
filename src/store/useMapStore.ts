// stores/useMapStore.ts
import { create } from 'zustand';

interface MapStore {
  markers: any[];
  setMarkers: (data: any[]) => void;
  // 사이드바, 모달 등 다른 상태도 여기에 추가 가능
}

export const useMapStore = create<MapStore>((set) => ({
  markers: [],
  setMarkers: (data) => set({ markers: data }),
}));
