/**
 * 本地数据网关：首次访问用种子数据初始化 localStorage，之后读写均走持久层。
 * 后端在线时 GET 会优先使用 /api；本演示环境后端为离线脚手架，统一回退到本地数据。
 */
import { mockData } from "../mocks/seedData";
import { isSeeded, markSeeded, readTable, writeTable, type PersistKey } from "./persistence";
import type { Warehouse } from "../types/Warehouse";
import type { SupplyItem } from "../types/SupplyItem";
import type { InventoryBatch } from "../types/InventoryBatch";
import type { Shelter } from "../types/Shelter";
import type { DispatchOrder } from "../types/DispatchOrder";

type LocalSchema = {
  warehouse: Warehouse[];
  supplyItem: SupplyItem[];
  inventoryBatch: InventoryBatch[];
  shelter: Shelter[];
  dispatchOrder: DispatchOrder[];
};

const seedOf = (name: PersistKey) => {
  const key = name === "supplyItem" ? "supplyItem" : name;
  return structuredClone(mockData[key as keyof typeof mockData]);
};

export function ensureSeeded(): void {
  if (isSeeded()) return;
  (Object.keys(mockData) as (keyof LocalSchema)[]).forEach((name) => {
    writeTable(name as PersistKey, structuredClone(mockData[name]) as never[]);
  });
  markSeeded();
}

export function localList<K extends keyof LocalSchema>(name: K): LocalSchema[K] {
  ensureSeeded();
  return (readTable<LocalSchema[K][number]>(name as PersistKey) ??
    seedOf(name as PersistKey)) as LocalSchema[K];
}

export function localSave<K extends keyof LocalSchema>(name: K, rows: LocalSchema[K]): LocalSchema[K] {
  ensureSeeded();
  writeTable(name as PersistKey, rows as never[]);
  return rows;
}
