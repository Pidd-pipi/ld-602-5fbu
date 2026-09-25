import { LOG_TEMPLATES } from "../constants/logTemplates";
import type { DispatchOrder, DispatchLine, DispatchProgress } from "../types/DispatchOrder";
import { buildDispatchPlan } from "./dispatchPlanner";
import type { PersistSnapshot } from "./localRepository";
import { saveSnapshot } from "./localRepository";
import type { InventoryBatch } from "../types/InventoryBatch";

export interface ApproveInput {
  orderId: number;
  actor: string;
  /** 跌破安全库存时调度员必须写明的原因 */
  safetyReason?: string;
  note?: string;
}

export class DispatchFlowError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = "DispatchFlowError";
  }
}

function render(template: string, params: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(params[key] ?? `{${key}}`));
}

function log(level: string, template: string, params: Record<string, string | number>) {
  // 本地操作日志：真实环境由后端 auditLog 中间件双写，这里落到控制台便于联调。
  console[level === "warn" ? "warn" : "info"](`[audit] ${render(template, params)}`);
}

function nowIso(): string {
  return new Date().toISOString();
}

function pushProgress(order: DispatchOrder, entry: DispatchProgress) {
  order.progress = [...order.progress, entry];
}

function findOrder(snapshot: PersistSnapshot, orderId: number): DispatchOrder {
  const order = snapshot.dispatchOrder.find((entry) => entry.id === orderId);
  if (!order) throw new DispatchFlowError("DISPATCH_NOT_FOUND", "调拨单不存在或已被处理");
  return order;
}

/** 试算（不改数据）：详情抽屉打开时调用，展示来源仓、批次余量/到期日、缺口与阻塞原因 */
export function previewDispatch(snapshot: PersistSnapshot, orderId: number) {
  const order = findOrder(snapshot, orderId);
  return buildDispatchPlan(order, snapshot.inventoryBatch, snapshot.supplyItem, snapshot.warehouse);
}

/**
 * 批准：库存不足 / 仓库停用则保持待审并返回缺口；
 * 临期/跌破安全库存时必须写明原因；通过则锁定 FEFO 批次方案。
 */
export function approveDispatch(snapshot: PersistSnapshot, input: ApproveInput): PersistSnapshot {
  const order = findOrder(snapshot, input.orderId);
  if (order.status !== "SUBMITTED") {
    throw new DispatchFlowError("DISPATCH_STATUS_CONFLICT", `当前状态为 ${order.status}，不能执行批准`);
  }

  const plan = buildDispatchPlan(order, snapshot.inventoryBatch, snapshot.supplyItem, snapshot.warehouse);
  if (!plan.canApprove) {
    // 库存不足或仓库停用：单据保持 SUBMITTED，只补充缺口与原因，便于调度员后续跟进。
    order.gaps = plan.gaps;
    order.block_reasons = plan.blockReasons;
    order.decision_note = plan.blockReasons.map((reason) => reason.message).join("；");
    pushProgress(order, {
      status: "SUBMITTED",
      at: nowIso(),
      actor: input.actor,
      remark: `批准未通过，保持待审：${order.decision_note}`
    });
    log("warn", LOG_TEMPLATES.DispatchOrder[2], {
      orderNo: order.order_no,
      gaps: plan.gaps.map((gap) => `${gap.supply_name} 缺 ${gap.shortage_quantity}${gap.unit}`).join("、") || "无"
    });
    return saveSnapshot(snapshot);
  }

  if (plan.requireSafetyReason && !input.safetyReason?.trim()) {
    throw new DispatchFlowError("VALIDATION_FAILED", "出库将导致低于安全库存，请填写原因说明后再批准");
  }

  // 锁定批次方案（快照到明细行），出库前不实际扣减库存
  const linesWithPlan: DispatchLine[] = plan.lines.map((planLine) => ({
    id: planLine.line.id,
    supply_item_id: planLine.item.id,
    supply_name: planLine.item.name,
    sku_code: planLine.item.sku_code,
    unit: planLine.item.unit,
    requested_quantity: planLine.line.requested_quantity,
    allocations: planLine.allocations
  }));

  order.lines = linesWithPlan;
  order.gaps = [];
  order.block_reasons = plan.blockReasons;
  order.status = "APPROVED";
  order.approved_by = input.actor;
  order.approved_at = nowIso();
  const notes: string[] = [];
  if (input.note?.trim()) notes.push(input.note.trim());
  if (input.safetyReason?.trim()) notes.push(`低于安全库存放行原因：${input.safetyReason.trim()}`);
  order.decision_note = notes.join("；") || "已批准，按 FEFO 锁定批次方案。";
  pushProgress(order, {
    status: "APPROVED",
    at: order.approved_at,
    actor: input.actor,
    remark: order.decision_note
  });
  log("info", LOG_TEMPLATES.DispatchOrder[1], {
    orderNo: order.order_no,
    lines: order.lines.length
  });
  return saveSnapshot(snapshot);
}

/** 出库：按批准时锁定的 FEFO 方案实际扣减批次余量 */
export function dispatchOrder(snapshot: PersistSnapshot, orderId: number, actor: string): PersistSnapshot {
  const order = findOrder(snapshot, orderId);
  if (order.status !== "APPROVED") {
    throw new DispatchFlowError("DISPATCH_STATUS_CONFLICT", `当前状态为 ${order.status}，不能执行出库`);
  }

  for (const line of order.lines) {
    for (const allocation of line.allocations) {
      const batch = snapshot.inventoryBatch.find((entry) => entry.id === allocation.batch_id);
      if (!batch) throw new DispatchFlowError("VALIDATION_FAILED", `批次 ${allocation.batch_no} 不存在`);
      if (batch.quantity < allocation.allocated_quantity) {
        throw new DispatchFlowError(
          "DISPATCH_STOCK_SHORTAGE",
          `批次 ${allocation.batch_no} 余量 ${batch.quantity} 不足 ${allocation.allocated_quantity}，请重新审批`
        );
      }
      batch.quantity -= allocation.allocated_quantity;
      markNearExpire(batch);
      log("info", LOG_TEMPLATES.DispatchOrder[3], {
        orderNo: order.order_no,
        batchNo: allocation.batch_no,
        quantity: allocation.allocated_quantity,
        unit: line.unit
      });
    }
  }

  order.status = "DISPATCHED";
  order.dispatched_at = nowIso();
  order.decision_note = "批次已按 FEFO 方案出库，等待避难点签收。";
  pushProgress(order, {
    status: "DISPATCHED",
    at: order.dispatched_at,
    actor,
    remark: "按批准的批次方案完成出库装车"
  });
  return saveSnapshot(snapshot);
}

/** 签收：避难点确认收货，流程闭环 */
export function receiveOrder(snapshot: PersistSnapshot, orderId: number, actor: string, remark?: string): PersistSnapshot {
  const order = findOrder(snapshot, orderId);
  if (order.status !== "DISPATCHED") {
    throw new DispatchFlowError("DISPATCH_STATUS_CONFLICT", `当前状态为 ${order.status}，不能执行签收`);
  }
  order.status = "RECEIVED";
  order.received_at = nowIso();
  order.decision_note = remark?.trim() || "避难点已签收，数量与批次核对无误。";
  pushProgress(order, {
    status: "RECEIVED",
    at: order.received_at,
    actor,
    remark: order.decision_note
  });
  log("info", LOG_TEMPLATES.DispatchOrder[4], { orderNo: order.order_no, shelter: order.shelter_name });
  return saveSnapshot(snapshot);
}

/** 驳回 */
export function rejectOrder(snapshot: PersistSnapshot, orderId: number, actor: string, reason: string): PersistSnapshot {
  const order = findOrder(snapshot, orderId);
  if (order.status !== "SUBMITTED") {
    throw new DispatchFlowError("DISPATCH_STATUS_CONFLICT", `当前状态为 ${order.status}，不能驳回`);
  }
  if (!reason.trim()) throw new DispatchFlowError("VALIDATION_FAILED", "驳回必须填写原因");
  order.status = "REJECTED";
  order.decision_note = reason.trim();
  pushProgress(order, { status: "REJECTED", at: nowIso(), actor, remark: reason.trim() });
  log("warn", LOG_TEMPLATES.DispatchOrder[5], { orderNo: order.order_no, reason: reason.trim() });
  return saveSnapshot(snapshot);
}

function markNearExpire(batch: InventoryBatch) {
  if (batch.quality_status === "QUALIFIED") {
    const days = (new Date(batch.expire_at).getTime() - Date.now()) / (24 * 60 * 60 * 1000);
    if (days < 0) batch.quality_status = "EXPIRED";
    else if (days <= 30) batch.quality_status = "NEAR_EXPIRE";
  }
}
