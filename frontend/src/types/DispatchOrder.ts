import type { DispatchStatus } from "../constants/DispatchStatus";

/** 审批/出库/签收时间线节点 */
export interface DispatchProgress {
  status: DispatchStatus;
  at: string;
  actor: string;
  remark?: string;
}

/** 批次分配方案（FEFO：先临期批次，后后续批次） */
export interface DispatchBatchAllocation {
  batch_id: number;
  batch_no: string;
  expire_at: string;
  /** 本批次可用余量（审批快照时刻） */
  available_quantity: number;
  /** 本批次计划/实际扣减数量 */
  allocated_quantity: number;
  /** 临期标记，用于列表高亮 */
  near_expire: boolean;
}

/** 物资缺口（库存不足时保持待审的依据） */
export interface DispatchLineGap {
  supply_item_id: number;
  supply_name: string;
  unit: string;
  requested_quantity: number;
  available_quantity: number;
  shortage_quantity: number;
}

/** 安全库存/停用等阻塞原因 */
export interface DispatchBlockReason {
  level: "ERROR" | "WARNING";
  code: string;
  message: string;
}

/** 调拨明细行：申请物资与数量，以及审批时算出的批次方案 */
export interface DispatchLine {
  id: number;
  supply_item_id: number;
  supply_name: string;
  sku_code: string;
  unit: string;
  requested_quantity: number;
  allocations: DispatchBatchAllocation[];
}

export interface DispatchOrder {
  id: number;
  order_no: string;
  event_id: number;
  event_name: string;
  source_warehouse_id: number;
  source_warehouse_name: string;
  shelter_id: number;
  shelter_name: string;
  priority: string;
  status: DispatchStatus;
  requested_by: string;
  requested_at: string;
  approved_by: string;
  approved_at: string;
  dispatched_at: string;
  received_at: string;
  /** 审批时留存的结论说明（缺口/安全库存/停用原因等） */
  decision_note: string;
  lines: DispatchLine[];
  gaps: DispatchLineGap[];
  block_reasons: DispatchBlockReason[];
  progress: DispatchProgress[];
}
