import type { SupplyCategory } from "./SupplyCategory";

export const DispatchPriority = ["URGENT", "HIGH", "NORMAL"] as const;
export type DispatchPriority = (typeof DispatchPriority)[number];
export const DispatchPriorityText: Record<DispatchPriority, string> = {
  URGENT: "紧急",
  HIGH: "高",
  NORMAL: "常规"
};
export const DispatchPriorityRank: Record<DispatchPriority, number> = {
  URGENT: 0,
  HIGH: 1,
  NORMAL: 2
};

export const WarehouseStatus = ["ACTIVE", "DISABLED"] as const;
export type WarehouseStatus = (typeof WarehouseStatus)[number];
export const WarehouseStatusText: Record<WarehouseStatus, string> = {
  ACTIVE: "启用中",
  DISABLED: "已停用"
};

export const QualityStatus = ["QUALIFIED", "NEAR_EXPIRY", "EXPIRED", "QUARANTINED"] as const;
export type QualityStatus = (typeof QualityStatus)[number];
export const QualityStatusText: Record<QualityStatus, string> = {
  QUALIFIED: "合格",
  NEAR_EXPIRY: "临期",
  EXPIRED: "已过期",
  QUARANTINED: "隔离冻结"
};

export const ShelterRiskLevel = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export type ShelterRiskLevel = (typeof ShelterRiskLevel)[number];
export const ShelterRiskLevelText: Record<ShelterRiskLevel, string> = {
  LOW: "低",
  MEDIUM: "中",
  HIGH: "高",
  CRITICAL: "严重"
};

export const SupplyCategoryUnitHints: Partial<Record<SupplyCategory, string>> = {
  FOOD: "箱",
  WATER: "箱",
  MEDICAL: "件",
  SHELTER: "顶",
  RESCUE_TOOL: "台"
};
