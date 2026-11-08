import { create } from 'zustand';
import { PickupRequest, PickupStatus } from '../types/collector';
import { pickupService } from '../services/pickup.service';
import { collectorService } from '../services/collector.service';

interface PickupState {
  activePickup: PickupRequest | null;
  myPickups: PickupRequest[];
  nearbyPickups: PickupRequest[];
  assignedPickups: PickupRequest[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchMyPickups: () => Promise<PickupRequest[]>;
  fetchNearbyPickups: (lat: number, lng: number, radius?: number) => Promise<PickupRequest[]>;
  fetchAssignedPickups: () => Promise<PickupRequest[]>;
  setActivePickup: (pickup: PickupRequest | null) => void;
  updateLocalPickupStatus: (pickupId: string, status: PickupStatus) => void;
  clearError: () => void;
}

export const usePickupStore = create<PickupState>((set, get) => ({
  activePickup: null,
  myPickups: [],
  nearbyPickups: [],
  assignedPickups: [],
  loading: false,
  error: null,

  fetchMyPickups: async () => {
    set({ loading: true, error: null });
    try {
      const data = await pickupService.getMyPickups();
      const ongoing = data.find(
        (p) => p.status === 'IN_TRANSIT' || p.status === 'ACCEPTED' || p.status === 'PENDING'
      );
      set({
        myPickups: data,
        activePickup: ongoing || (data.length > 0 ? data[0] : null),
        loading: false,
      });
      return data;
    } catch (e: any) {
      set({ error: e?.message || 'Failed to fetch pickups', loading: false });
      return [];
    }
  },

  fetchNearbyPickups: async (lat: number, lng: number, radius = 5000) => {
    set({ loading: true, error: null });
    try {
      const data = await pickupService.getNearbyPickups(lat, lng, radius);
      set({ nearbyPickups: data, loading: false });
      return data;
    } catch (e: any) {
      set({ error: e?.message || 'Failed to fetch nearby pickups', loading: false });
      return [];
    }
  },

  fetchAssignedPickups: async () => {
    set({ loading: true, error: null });
    try {
      const data = await collectorService.getAssignedPickups();
      set({ assignedPickups: data, loading: false });
      return data;
    } catch (e: any) {
      set({ error: e?.message || 'Failed to fetch assigned pickups', loading: false });
      return [];
    }
  },

  setActivePickup: (pickup) => {
    set({ activePickup: pickup });
  },

  updateLocalPickupStatus: (pickupId: string, status: PickupStatus) => {
    set((state) => {
      const updateList = (list: PickupRequest[]) =>
        list.map((p) => (p.id === pickupId ? { ...p, status } : p));

      const updatedActive =
        state.activePickup?.id === pickupId
          ? { ...state.activePickup, status }
          : state.activePickup;

      return {
        activePickup: updatedActive,
        myPickups: updateList(state.myPickups),
        nearbyPickups: updateList(state.nearbyPickups),
        assignedPickups: updateList(state.assignedPickups),
      };
    });
  },

  clearError: () => set({ error: null }),
}));

