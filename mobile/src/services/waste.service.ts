import { apiClient } from './api';
import type { ListingInput, WasteCategory, WasteListing } from '../types/waste';

export async function getCategories(): Promise<WasteCategory[]> {
  const res = await apiClient.get('/waste/categories');
  return res.data.data;
}

export async function getMyListings(
  scope: 'active' | 'scheduled' | 'history' | 'drafts' = 'active'
): Promise<WasteListing[]> {
  const res = await apiClient.get('/waste/listings/mine', { params: { scope } });
  return res.data.data;
}

export async function getSummary() {
  const res = await apiClient.get('/waste/summary');
  return res.data.data;
}

// Uploads one photo and returns its Cloudinary URL
export async function uploadImage(uri: string): Promise<string> {
  const name = uri.split('/').pop() || 'photo.jpg';
  const ext = name.split('.').pop()?.toLowerCase();
  const type = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

  const form = new FormData();
  form.append('image', { uri, name, type } as unknown as Blob);

  const res = await apiClient.post('/waste/uploads', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000, // photos are slow on mobile data
  });
  return res.data.data.url;
}

export async function createListing(input: ListingInput): Promise<WasteListing> {
  const res = await apiClient.post('/waste/listings', input);
  return res.data.data;
}

export async function updateListing(id: string, input: ListingInput): Promise<WasteListing> {
  const res = await apiClient.put(`/waste/listings/${id}`, input);
  return res.data.data;
}

export async function deleteListing(id: string): Promise<void> {
  await apiClient.delete(`/waste/listings/${id}`);
}
