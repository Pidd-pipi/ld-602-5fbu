import type { SupplyItem } from "../types/SupplyItem";

export const createDefaultSupplyItem = (overrides: Partial<SupplyItem> = {}): SupplyItem => ({
  id: 0,
  sku_code: "",
  name: "",
  category: "WATER",
  unit: "箱",
  safety_stock: 0,
  expire_days: 365,
  storage_requirement: "常温",
  ...overrides
});

export const createSupplyItemForm = createDefaultSupplyItem;
export const createSupplyItemResponse = createDefaultSupplyItem;
