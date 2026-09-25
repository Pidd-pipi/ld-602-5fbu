export type WarehouseStatus = "ACTIVE" | "DISABLED";

export interface Warehouse {
  id: number;
  name: string;
  district: string;
  address: string;
  manager_id: number;
  manager_name: string;
  capacity_level: number;
  contact_phone: string;
  status: WarehouseStatus;
  disabled_reason: string;
}
