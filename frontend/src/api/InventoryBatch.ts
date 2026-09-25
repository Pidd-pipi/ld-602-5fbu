import { mockData } from "../mocks/seedData";
import type { InventoryBatch } from "../types/InventoryBatch";
import { loadSnapshot } from "../services/localRepository";

const endpoint = "/api/inventory-batch";

export async function listInventoryBatch(): Promise<InventoryBatch[]> {
  try {
    const res = await fetch(endpoint, { headers: { Accept: "application/json" } });
    if (res.ok) {
      const body = (await res.json()) as unknown;
      if (Array.isArray(body) && body.length > 0 && "batch_no" in (body[0] as Record<string, unknown>)) {
        return body as InventoryBatch[];
      }
    }
  } catch {
    // Local mock fallback keeps the UI available during offline review.
  }
  const local = loadSnapshot();
  if (local.inventoryBatch.length > 0) return local.inventoryBatch;
  return [...(mockData.inventoryBatch as unknown as InventoryBatch[])];
}

export async function saveInventoryBatch(payload: InventoryBatch) {
  console.info("save InventoryBatch", payload);
  return payload;
}
