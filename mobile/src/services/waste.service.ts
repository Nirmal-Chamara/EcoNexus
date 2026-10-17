import { apiClient } from "./api";
import { WasteCategory, WasteListing } from "../types/waste";

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