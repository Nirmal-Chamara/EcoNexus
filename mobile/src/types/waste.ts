import { apiClient } from '../services/api';

export interface WasteCategory {
  id: number;
  name: string;
  description?: string | null;
  icon?: string | null;
}

export interface ListingImage {
  url: string;
  label?: string | null;
}

export type ListingStatus =
  'draft' | 'active' | 'requested' | 'scheduled' | 'collected' | 'cancelled';

export type ContainerSize = 'small' | 'medium' | 'bulk';
export type Pathway = 'recycle' | 'sell' | 'donate' | 'reuse';

// Shape returned by the API (we will check the exact field names against real
// data when we build My Listings, next).
export interface WasteListing {
  id: string;
  listing_code?: string;
  title: string;
  description?: string | null;
  category_id: number;
  category_name?: string;
  quantity: number | string;
  unit: 'kg' | 'items';
  container_size?: ContainerSize;
  is_cleaned?: boolean;
  is_sorted?: boolean;
  pathway?: Pathway;
  status: ListingStatus;
  images?: ListingImage[];
  created_at?: string;
}

// What we send when creating or editing a listing
export interface ListingInput {
  categoryId: number;
  title?: string;
  description?: string;
  quantity: number;
  unit: 'kg' | 'items';
  condition?: string;
  containerSize?: ContainerSize;
  isCleaned?: boolean;
  isSorted?: boolean;
  pathway?: Pathway;
  status?: 'draft' | 'active';
  photos?: ListingImage[];
  imageUrls?: string[];
}

export interface WasteSummary {
  counts: { active: number; scheduled: number; history: number; drafts: number };
  recycled_kg: number;
}

export async function getSummary(): Promise<WasteSummary> {
  const res = await apiClient.get('/waste/summary');
  return res.data.data;
}