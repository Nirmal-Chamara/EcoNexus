export type PickupStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'IN_TRANSIT'
  | 'COMPLETED'
  | 'CANCELLED';

export interface CollectorProfile {
  user_id: string;
  vehicle_type: string | null;
  vehicle_capacity: number | null;
  is_available: boolean;
  rating: number;
  completed_pickups: number;
  created_at?: string;
  updated_at?: string;
  latitude: number | null;
  longitude: number | null;
  name?: string;
  email?: string;
  phone?: string;
}

export interface UpdateCollectorProfileDto {
  vehicleType?: string;
  vehicleCapacity?: number;
  isAvailable?: boolean;
}

export interface UpdateLocationDto {
  latitude: number;
  longitude: number;
}

export interface PickupRequest {
  id: string;
  user_id: string;
  address_text: string;
  waste_type: string;
  estimated_weight: number | null;
  images: string[] | null;
  status: PickupStatus;
  notes: string | null;
  scheduled_time: string | null;
  created_at: string;
  updated_at?: string;
  latitude: number;
  longitude: number;
  distance_meters?: number;
  // Allocation/User details when joined
  allocation_id?: string;
  assigned_at?: string;
  completed_at?: string | null;
  user_name?: string;
  user_phone?: string;
  user_email?: string;
}

export interface CreatePickupDto {
  latitude: number;
  longitude: number;
  address: string;
  wasteType: string;
  estimatedWeight?: number;
  notes?: string;
  images?: string[];
  scheduledTime?: string;
}
