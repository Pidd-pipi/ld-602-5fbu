import type { DispatchOrder } from "../types/DispatchOrder";
import type { DispatchLine } from "../types/DispatchLine";
import type { InventoryBatch } from "../types/InventoryBatch";
import type { Warehouse } from "../types/Warehouse";
import type { SupplyItem } from "../types/SupplyItem";
import type { ApprovalPlan } from "../types/AllocationPlan";
import type { ApprovalTimelineEntry } from "../types/ApprovalTimeline";
import { buildApprovalPlan } from "./allocationEngine";
import { ERROR_MESSAGES } from "../constants/errorMessages";

let timelineSeq = 1;
const nextTimelineId = (orders: DispatchOrder[]) =>
  Math.max(0, ...orders.flatMap((o) => o.timeline.map((t) => t.id))) + timelineSeq++;

export class WorkflowError extends Error {
  constructor(public code: keyof typeof ERROR_MESSAGES, message: string) {
    super(message);
  }
}

const nowIso = () => new Date().toISOString();

const pushTimeline = (
  orders: DispatchOrder[],
  order: DispatchOrder,
  entry: Omit<ApprovalTimelineEntry, "id" | "created_at"> & { created_at?: string }
): void => {
  order.timeline = [
    ...order.timeline,
    { id: nextTimelineId(orders), created_at: nowIso(), ...entry }
  ];
};

const assertStatus = (order: DispatchOrder, expected: string) => {
  if (order.status !== expected) {
    throw new WorkflowError("ORDER_STATUS_INVALID", ERROR_MESSAGES.ORDER_STATUS_INVALID);
  }
};

/**
 * 审批校验（不改变状态）：详情页“点开即看”来源仓库、批次剩余量、到期日、缺口。
 */
export const previewApproval = (
  order: DispatchOrder,
  warehouses: Warehouse[],
  batches: InventoryBatch[],
  items: SupplyItem[]
): ApprovalPlan => buildApprovalPlan(order, warehouses, batches, items);

export interface ApproveParams {
  actor: string;
  /** 低于安全库存时必填的强制出库原因 */
  forceReason?: string;
}

export interface ApproveResult {
  order: DispatchOrder;
  plan: ApprovalPlan;
  blocked: boolean;
}

/**
 * 批准：
 * 1) 仓库停用 / 库存缺口为硬拦截 -> 保持 SUBMITTED，记录缺口到列表与详情；
 * 2) 出库后低于安全库存为软预警 -> 必须填写原因，随结果留痕；
 * 3) 通过则按 FEFO 冻结批次分配到每行（出库前批次剩余量不动）。
 */
export function approveOrder(
  orders: DispatchOrder[],
  orderId: number,
  warehouses: Warehouse[],
  batches: InventoryBatch[],
  items: SupplyItem[],
  params: ApproveParams
): ApproveResult {
  const order = orders.find((o) => o.id === orderId);
  if (!order) throw new WorkflowError("VALIDATION_FAILED", `调拨单不存在：${orderId}`);
  assertStatus(order, "SUBMITTED");

  const plan = buildApprovalPlan(order, warehouses, batches, items);

  if (!plan.approvable) {
    // 硬拦截：保持待审，把缺口/停用原因挂到单据上并写入时间线
    order.blocking_reasons = plan.blocking_reasons;
    order.warning_reasons = plan.warning_reasons;
    order.lines = mergePlanIntoLines(order.lines, plan);
    pushTimeline(orders, order, {
      action: "CHECK",
      actor: "系统",
      note: `审批校验未通过，单据保持待审批：${plan.blocking_reasons.join("；")}`
    });
    return { order, plan, blocked: true };
  }

  if (plan.has_warning && !(params.forceReason ?? "").trim()) {
    throw new WorkflowError("FORCE_REASON_REQUIRED", ERROR_MESSAGES.FORCE_REASON_REQUIRED);
  }

  // 通过：冻结 FEFO 分配快照
  order.status = "APPROVED";
  order.approved_by = params.actor;
  order.approved_at = nowIso();
  order.blocking_reasons = [];
  order.warning_reasons = plan.warning_reasons;
  order.force_reason = plan.has_warning ? (params.forceReason ?? "").trim() : "";
  order.lines = mergePlanIntoLines(order.lines, plan);
  pushTimeline(orders, order, {
    action: "APPROVE",
    actor: params.actor,
    note:
      `审批通过，按到期先后（临期优先）冻结批次。` +
      summarizeAllocation(plan) +
      (plan.has_warning ? ` 强制出库原因：${order.force_reason}` : "")
  });
  return { order, plan, blocked: false };
}

const mergePlanIntoLines = (lines: DispatchLine[], plan: ApprovalPlan): DispatchLine[] =>
  lines.map((line) => {
    const p = plan.line_plans.find((x) => x.supply_item_id === line.supply_item_id);
    if (!p) return line;
    return {
      ...line,
      available_quantity: p.available_quantity,
      gap_quantity: p.gap_quantity,
      excluded_expired_quantity: p.excluded_expired_quantity,
      excluded_quarantined_quantity: p.excluded_quarantined_quantity,
      safety_stock: p.safety_stock,
      post_remaining: p.post_remaining,
      below_safety_after: p.below_safety_after,
      // 库存不足时也保留“可出部分”的 FEFO 分配，缺口补齐后再次批准即可接续
      allocations: p.allocations
    };
  });

const summarizeAllocation = (plan: ApprovalPlan): string =>
  plan.line_plans
    .map((p) => {
      const seq = p.allocations
        .map((a) => `${a.batch_no}（${a.allocate_quantity}，${a.near_expiry ? "临期" : "正常"}）`)
        .join(" → ");
      return `物资#${p.supply_item_id}：${seq || "无可用批次"}`;
    })
    .join("；");

/** 出库前再校验一次安全库存（防止批准后库存变化） */
export function dispatchOrder(
  orders: DispatchOrder[],
  batches: InventoryBatch[],
  orderId: number,
  actor: string,
  vehicleNote: string
): { order: DispatchOrder; affectedBatches: InventoryBatch[] } {
  const order = orders.find((o) => o.id === orderId);
  if (!order) throw new WorkflowError("VALIDATION_FAILED", `调拨单不存在：${orderId}`);
  assertStatus(order, "APPROVED");

  // 按批准时冻结的分配快照逐批扣减 remaining_quantity
  const affected = new Map<number, number>();
  for (const line of order.lines) {
    for (const alloc of line.allocations) {
      affected.set(
        alloc.batch_id,
        (affected.get(alloc.batch_id) ?? 0) + alloc.allocate_quantity
      );
    }
  }
  const affectedBatches: InventoryBatch[] = [];
  for (const [batchId, total] of affected) {
    const batch = batches.find((b) => b.id === batchId);
    if (!batch || batch.remaining_quantity < total) {
      throw new WorkflowError(
        "INSUFFICIENT_BATCH_STOCK",
        `批次 ${batch?.batch_no ?? batchId} 剩余量已变化，库存不足，请退回重新审批`
      );
    }
    batch.remaining_quantity -= total;
    affectedBatches.push(batch);
  }

  order.status = "DISPATCHED";
  order.dispatched_at = nowIso();
  pushTimeline(orders, order, {
    action: "DISPATCH",
    actor,
    note:
      `仓库按批准的 FEFO 顺序出库，已扣减 ${affectedBatches.length} 个批次库存。` +
      (vehicleNote ? ` 运输信息：${vehicleNote}` : "")
  });
  return { order, affectedBatches };
}

export function receiveOrder(
  orders: DispatchOrder[],
  orderId: number,
  actor: string,
  note: string
): DispatchOrder {
  const order = orders.find((o) => o.id === orderId);
  if (!order) throw new WorkflowError("VALIDATION_FAILED", `调拨单不存在：${orderId}`);
  assertStatus(order, "DISPATCHED");
  order.status = "RECEIVED";
  order.received_by = actor;
  order.received_at = nowIso();
  order.receive_note = note.trim();
  pushTimeline(orders, order, {
    action: "RECEIVE",
    actor,
    note: `避难点签收确认。${note ? ` 签收备注：${note.trim()}` : "数量与批次核对无误。"}`
  });
  return order;
}

export function rejectOrder(
  orders: DispatchOrder[],
  orderId: number,
  actor: string,
  reason: string
): DispatchOrder {
  const order = orders.find((o) => o.id === orderId);
  if (!order) throw new WorkflowError("VALIDATION_FAILED", `调拨单不存在：${orderId}`);
  assertStatus(order, "SUBMITTED");
  if (!reason.trim()) {
    throw new WorkflowError("VALIDATION_FAILED", "驳回时必须填写原因");
  }
  order.status = "REJECTED";
  order.reject_reason = reason.trim();
  // 驳回释放所有冻结中的分配（待审阶段本来就未扣库存，只需清空快照）
  order.lines = order.lines.map((line) => ({ ...line, allocations: [] }));
  pushTimeline(orders, order, {
    action: "REJECT",
    actor,
    note: `审批驳回：${reason.trim()}`
  });
  return order;
}
