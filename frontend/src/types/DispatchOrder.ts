import type { DispatchStatus } from "../constants/DispatchStatus";
import type { DispatchPriority } from "../constants/businessEnums";
import type { DispatchLine } from "./DispatchLine";
import type { ApprovalTimelineEntry } from "./ApprovalTimeline";

export interface DispatchOrder {
  id: number;
  order_no: string;
  event_id: number | null;
  event_name: string;
  source_warehouse_id: number;
  shelter_id: number;
  priority: DispatchPriority;
  status: DispatchStatus;
  requested_by: string;
  approved_by: string;
  received_by: string;
  created_at: string;
  approved_at: string;
  dispatched_at: string;
  received_at: string;
  lines: DispatchLine[];
  timeline: ApprovalTimelineEntry[];
  /** 硬拦截原因（仓库停用 / 库存缺口），写入后单据保持待审 */
  blocking_reasons: string[];
  /** 软预警（出库后低于安全库存），批准时需填写说明 */
  warning_reasons: string[];
  /** 审批员在低于安全库存时填写的强制出库说明 */
  force_reason: string;
  reject_reason: string;
  receive_note: string;
}
