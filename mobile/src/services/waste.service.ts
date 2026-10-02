import { api } from "./api";
import { WasteCategory } from "../types/waste";

export async function getCategories(): Promise<WasteCategory[]> {
  const res = await api.get("/waste/categories");
  return res.data.data;
}