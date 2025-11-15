import { create } from 'zustand';
import type { PlaceDto } from '../types/place';

interface PlaceState {
  placesById: Map<string, PlaceDto>;
  addPlaces: (places: PlaceDto[]) => void;
}

export const usePlaceStore = create<PlaceState>((set) => ({
  placesById: new Map(),
  addPlaces: (places) =>
    set((state) => {
      const newPlacesById = new Map(state.placesById);
      places.forEach((place) => {
        // 항상 최신 정보로 덮어쓰기
        newPlacesById.set(place.id, place);
      });
      return {
        placesById: newPlacesById,
      };
    }),
}));