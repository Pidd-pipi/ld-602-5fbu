import { mockData } from "../mocks/seedData";
import type { DispatchOrder } from "../types/DispatchOrder";
import type { InventoryBatch } from "../types/InventoryBatch";
import type { Warehouse } from "../types/Warehouse";
import type { SupplyItem } from "../types/SupplyItem";
import type { Shelter } from "../types/Shelter";

/**
 * 本地唯一数据源：首次进入用种子数据初始化，之后的审批/出库/签收结果
 * 持久化到 localStorage，切换页面或刷新后仍能看到进度。
 * 真实部署时这里整体替换为后端 /api 调用，调用方无需改动。
 */
const STORAGE_KEY = "rescue-stock:state:v2";

export interface PersistSnapshot {
  warehouse: Warehouse[];
  supplyItem: SupplyItem[];
  inventoryBatch: InventoryBatch[];
  shelter: Shelter[];
  dispatchOrder: DispatchOrder[];
}

const deepClone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export function buildSeedSnapshot(): PersistSnapshot {
  return {
    warehouse: deepClone(mockData.warehouse) as unknown as Warehouse[],
    supplyItem: deepClone(mockData.supplyItem) as unknown as SupplyItem[],
    inventoryBatch: deepClone(mockData.inventoryBatch) as unknown as InventoryBatch[],
    shelter: deepClone(mockData.shelter) as unknown as Shelter[],
    dispatchOrder: deepClone(mockData.dispatchOrder) as unknown as DispatchOrder[]
  };
}

function hasPersistedData(raw: string | null): raw is string {
  if (!raw) return false;
  try {
    const parsed = JSON.parse(raw) as Partial<PersistSnapshot>;
    return Array.isArray(parsed.dispatchOrder) && Array.isArray(parsed.inventoryBatch);
  } catch {
    return false;
  }
}

export function loadSnapshot(): PersistSnapshot {
  if (typeof localStorage === "undefined") return buildSeedSnapshot();
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!hasPersistedData(raw)) {
    const seed = buildSeedSnapshot();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }
  return JSON.parse(raw) as PersistSnapshot;
}

export function saveSnapshot(snapshot: PersistSnapshot): PersistSnapshot {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  }
  return snapshot;
}

export function resetSnapshot(): PersistSnapshot {
  const seed = buildSeedSnapshot();
  return saveSnapshot(seed);
}
