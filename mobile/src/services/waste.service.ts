import { apiClient } from "./api";
import { WasteCategory, WasteListing, CreateListingInput} from "../types/waste";

export async function getCategories(): Promise<WasteCategory[]> {
  const res = await apiClient.get("/waste/categories");
  return res.data.data;
}

export async function getMyListings(
  scope: "active" | "history" = "active"
): Promise<WasteListing[]> {
  const res = await apiClient.get("/waste/listings/mine", { params: { scope } });
  return res.data.data;
}

export async function uploadImage(uri: string): Promise<string> {
  const name = uri.split("/").pop() || "photo.jpg";
  const ext = name.split(".").pop()?.toLowerCase();
  const type = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";

  const form = new FormData();
  form.append("image", { uri, name, type } as any);

  const res = await apiClient.post("/waste/uploads", form, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 60000, // photos are slow on mobile data
  });
  return res.data.data.url;
}

export async function createListing(input: CreateListingInput): Promise<WasteListing> {
  const res = await apiClient.post("/waste/listings", input);
  return res.data.data;
}