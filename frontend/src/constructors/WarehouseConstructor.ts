import type { Warehouse } from "../types/Warehouse";

export const createDefaultWarehouse = (overrides: Partial<Warehouse> = {}): Warehouse => ({
  id: 0,
  name: "",
  district: "",
  address: "",
  manager_id: 0,
  manager_name: "",
  capacity_level: 1,
  contact_phone: "",
  status: "ACTIVE",
  disabled_reason: "",
  ...overrides
});

export const createWarehouseForm = createDefaultWarehouse;
export const createWarehouseResponse = createDefaultWarehouse;
