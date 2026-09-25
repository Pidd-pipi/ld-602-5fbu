import type { QualityStatus } from "./InventoryBatch";

/**
 * 批准时按到期日先后（FEFO）计算出的单批次分配结果，
 * 批准后冻结到调拨行上，出库时按此扣减批次剩余量。
 */
export interface BatchAllocation {
  batch_id: number;
  batch_no: string;
  expire_at: string;
  allocate_quantity: number;
  remaining_before: number;
  remaining_after: number;
  quality_status: QualityStatus;
  near_expiry: boolean;
}

/** 审批校验后的单行计划：可用量、缺口、安全库存影响与批次分配顺序 */
export interface DispatchLinePlan {
  supply_item_id: number;
  requested_quantity: number;
  available_quantity: number;
  gap_quantity: number;
  excluded_expired_quantity: number;
  excluded_quarantined_quantity: number;
  safety_stock: number;
  post_remaining: number;
  below_safety_after: boolean;
  allocations: BatchAllocation[];
}

/** 整单调拨审批计划：硬拦截（停用/缺口）与软预警（低于安全库存）分开 */
export interface ApprovalPlan {
  order_id: number;
  warehouse_id: number;
  warehouse_active: boolean;
  approvable: boolean;
  has_warning: boolean;
  blocking_reasons: string[];
  warning_reasons: string[];
  line_plans: DispatchLinePlan[];
}
