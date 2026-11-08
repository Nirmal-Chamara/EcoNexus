export interface WasteCategory {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
}

export interface WasteListing {
  id: string;
  title: string;
  description: string | null;
  quantity: string; // Postgres returns decimals as strings; use Number() for math
  unit: "kg" | "items";
  condition: "clean" | "dirty" | "damaged" | "reusable";
  status: "active" | "requested" | "collected" | "cancelled";
  created_at: string;
  updated_at: string;
  category_id: number;
  category_name: string;
  images: string[];
}

export interface CreateListingInput {
  categoryId: number;
  title: string;
  description?: string;
  quantity: number;
  unit: "kg" | "items";
  condition: "clean" | "dirty" | "damaged" | "reusable";
  imageUrls: string[];
}