import { requestJson } from "./http";
import { localList, localSave } from "../services/localGateway";
import type { InventoryBatch } from "../types/InventoryBatch";

const endpoint = "/api/inventory-batch";

export async function listInventoryBatch(): Promise<InventoryBatch[]> {
  try {
    return await requestJson<InventoryBatch[]>(endpoint);
  } catch {
    // Local fallback keeps the UI available during offline review.
    return localList("inventoryBatch");
  }
}

export async function saveInventoryBatch(payload: InventoryBatch): Promise<InventoryBatch> {
  const rows = localList("inventoryBatch");
  const index = rows.findIndex((row) => row.id === payload.id);
  if (index >= 0) rows[index] = payload;
  else rows.push(payload);
  localSave("inventoryBatch", rows);
  return payload;
}
