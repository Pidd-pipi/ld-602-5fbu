/**
 * 本地数据仓库：localStorage 写穿持久化。
 * 后端离线时 API 层回退到这里；切换页面、刷新浏览器后审批/出库/签收进度仍保留。
 */
const PREFIX = "rescue-stock:data:";

export const persistKeys = {
  warehouse: `${PREFIX}warehouse`,
  supplyItem: `${PREFIX}supply-item`,
  inventoryBatch: `${PREFIX}inventory-batch`,
  shelter: `${PREFIX}shelter`,
  dispatchOrder: `${PREFIX}dispatch-order`,
  seeded: `${PREFIX}seeded-v2`
} as const;

export type PersistKey = keyof typeof persistKeys;

export function readTable<T>(name: PersistKey): T[] | null {
  try {
    const raw = localStorage.getItem(persistKeys[name]);
    if (!raw) return null;
    return JSON.parse(raw) as T[];
  } catch {
    return null;
  }
}

export function writeTable<T>(name: PersistKey, rows: T[]): void {
  localStorage.setItem(persistKeys[name], JSON.stringify(rows));
}

export function isSeeded(): boolean {
  return localStorage.getItem(persistKeys.seeded) === "true";
}

export function markSeeded(): void {
  localStorage.setItem(persistKeys.seeded, "true");
}

/** 重置演示数据（开发/评审用） */
export function resetAllTables(): void {
  Object.values(persistKeys).forEach((key) => localStorage.removeItem(key));
}
