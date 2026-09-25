import { requestJson } from "./http";
import { localList, localSave } from "../services/localGateway";
import type { Warehouse } from "../types/Warehouse";

const endpoint = "/api/warehouse";

export async function listWarehouse(): Promise<Warehouse[]> {
  try {
    return await requestJson<Warehouse[]>(endpoint);
  } catch {
    // Local fallback keeps the UI available during offline review.
    return localList("warehouse");
  }
}

export async function saveWarehouse(payload: Warehouse): Promise<Warehouse> {
  const rows = localList("warehouse");
  const index = rows.findIndex((row) => row.id === payload.id);
  if (index >= 0) rows[index] = payload;
  else rows.push(payload);
  localSave("warehouse", rows);
  return payload;
}
