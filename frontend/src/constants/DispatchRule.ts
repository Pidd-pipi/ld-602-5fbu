/** 调拨审批业务规则常量：临期阈值、安全库存口径等 */
export const NEAR_EXPIRE_DAYS = 30;
export const DispatchPriority = ["URGENT", "HIGH", "NORMAL"] as const;
export type DispatchPriority = (typeof DispatchPriority)[number];
export const DispatchPriorityText: Record<DispatchPriority, string> = {
  URGENT: "紧急",
  HIGH: "高",
  NORMAL: "常规"
};
export const BatchQualityStatus = ["QUALIFIED", "NEAR_EXPIRE", "EXPIRED", "DAMAGED"] as const;
export type BatchQualityStatus = (typeof BatchQualityStatus)[number];
export const BatchQualityStatusText: Record<BatchQualityStatus, string> = {
  QUALIFIED: "合格",
  NEAR_EXPIRE: "临期",
  EXPIRED: "过期",
  DAMAGED: "破损"
};
