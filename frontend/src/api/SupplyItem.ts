import { requestJson } from "./http";
import { localList, localSave } from "../services/localGateway";
import type { SupplyItem } from "../types/SupplyItem";

const endpoint = "/api/supply-item";

export async function listSupplyItem(): Promise<SupplyItem[]> {
  try {
    return await requestJson<SupplyItem[]>(endpoint);
  } catch {
    // Local fallback keeps the UI available during offline review.
    return localList("supplyItem");
  }
}

export async function saveSupplyItem(payload: SupplyItem): Promise<SupplyItem> {
  const rows = localList("supplyItem");
  const index = rows.findIndex((row) => row.id === payload.id);
  if (index >= 0) rows[index] = payload;
  else rows.push(payload);
  localSave("supplyItem", rows);
  return payload;
}
