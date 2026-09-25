import type { SupplyItem } from "../types/SupplyItem";

export const createDefaultSupplyItem = (overrides: Partial<SupplyItem> = {}): SupplyItem => ({
  id: 1 as never,
  sku_code: "sku code 1" as never,
  name: "name 1" as never,
  category: "WATER" as never,
  unit: "unit 1" as never,
  safety_stock: 100,
  expire_days: 365,
  storage_requirement: "storage requirement 1" as never,
  ...overrides
});

export const createSupplyItemForm = createDefaultSupplyItem;
export const createSupplyItemResponse = createDefaultSupplyItem;
