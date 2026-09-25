import type { BatchAllocation } from "./AllocationPlan";

/**
 * 调拨行：申请数量 + 批准时冻结的批次分配快照。
 * SUBMITTED 阶段 allocations 为空、gap_quantity 由详情页实时计算展示。
 */
export interface DispatchLine {
  id: number;
  supply_item_id: number;
  quantity: number;
  available_quantity: number;
  gap_quantity: number;
  /** 该仓库内已过期、不可参与分配的同物资数量（用于缺口说明） */
  excluded_expired_quantity: number;
  /** 隔离冻结、不可参与分配的同物资数量 */
  excluded_quarantined_quantity: number;
  safety_stock: number;
  post_remaining: number;
  below_safety_after: boolean;
  allocations: BatchAllocation[];
}
