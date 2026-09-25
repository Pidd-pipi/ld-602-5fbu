import type { InventoryBatch } from "../types/InventoryBatch";
import type { SupplyItem } from "../types/SupplyItem";
import type { Warehouse } from "../types/Warehouse";
import type { DispatchOrder } from "../types/DispatchOrder";
import type { ApprovalPlan, BatchAllocation, DispatchLinePlan } from "../types/AllocationPlan";
import { ERROR_MESSAGES } from "../constants/errorMessages";
import { isNearExpiry } from "../utils/formatters";

/** 可参与出库的批次：合格 + 临期，且仍有剩余；过期/隔离一律排除 */
export const isBatchAllocatable = (batch: InventoryBatch): boolean =>
  (batch.quality_status === "QUALIFIED" || batch.quality_status === "NEAR_EXPIRY") &&
  batch.remaining_quantity > 0;

/**
 * FEFO（First-Expired, First-Out）排序：
 * 到期日越早越先出；同日到期则先出临期标记批，再按批次号稳定排序。
 */
export const sortBatchesByExpiry = (batches: InventoryBatch[]): InventoryBatch[] =>
  [...batches].sort((a, b) => {
    const expireDiff = new Date(a.expire_at).getTime() - new Date(b.expire_at).getTime();
    if (expireDiff !== 0) return expireDiff;
    if (a.quality_status !== b.quality_status) {
      return a.quality_status === "NEAR_EXPIRY" ? -1 : 1;
    }
    return a.batch_no.localeCompare(b.batch_no);
  });

const supplyName = (items: SupplyItem[], id: number) => items.find((i) => i.id === id);

/**
 * 计算单行（一个物资）的批次分配计划：
 * 先出临期批次、再出后续批次，逐批扣减直到满足申请量；
 * 同时统计缺口、被排除的过期/隔离量、出库后是否低于安全库存。
 */
export function buildLinePlan(
  orderId: number,
  supplyItemId: number,
  requestedQuantity: number,
  batches: InventoryBatch[],
  items: SupplyItem[]
): DispatchLinePlan {
  const item = supplyName(items, supplyItemId);
  const safetyStock = item?.safety_stock ?? 0;

  // 批次由上层按来源仓库预过滤，这里只保留当前物资的可分配批次
  const candidateBatches = sortBatchesByExpiry(
    batches.filter((b) => b.supply_item_id === supplyItemId && isBatchAllocatable(b))
  );
  const excludedExpired = batches
    .filter((b) => b.supply_item_id === supplyItemId && b.quality_status === "EXPIRED")
    .reduce((sum, b) => sum + b.remaining_quantity, 0);
  const excludedQuarantined = batches
    .filter((b) => b.supply_item_id === supplyItemId && b.quality_status === "QUARANTINED")
    .reduce((sum, b) => sum + b.remaining_quantity, 0);

  const availableQuantity = candidateBatches.reduce((sum, b) => sum + b.remaining_quantity, 0);
  const gapQuantity = Math.max(0, requestedQuantity - availableQuantity);

  // FEFO 逐批分配（库存足够时填满申请量；不足时尽量分配并保留缺口）
  const allocations: BatchAllocation[] = [];
  let need = Math.min(requestedQuantity, availableQuantity);
  for (const b of candidateBatches) {
    if (need <= 0) break;
    const take = Math.min(need, b.remaining_quantity);
    if (take <= 0) continue;
    allocations.push({
      batch_id: b.id,
      batch_no: b.batch_no,
      expire_at: b.expire_at,
      allocate_quantity: take,
      remaining_before: b.remaining_quantity,
      remaining_after: b.remaining_quantity - take,
      quality_status: b.quality_status,
      near_expiry: b.quality_status === "NEAR_EXPIRY" || isNearExpiry(b.expire_at)
    });
    need -= take;
  }

  const postRemaining = Math.max(0, availableQuantity - requestedQuantity);

  return {
    supply_item_id: supplyItemId,
    requested_quantity: requestedQuantity,
    available_quantity: availableQuantity,
    gap_quantity: gapQuantity,
    excluded_expired_quantity: excludedExpired,
    excluded_quarantined_quantity: excludedQuarantined,
    safety_stock: safetyStock,
    post_remaining: postRemaining,
    below_safety_after: postRemaining < safetyStock,
    allocations
  };
}

const formatMessage = (template: string, params: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (_, key: string) => String(params[key] ?? ""));

/**
 * 整单审批计划（详情页点开即看、批准前再算一次）。
 * - blocking：来源仓库停用 / 库存缺口 -> 不可批准，单据保持待审并列出缺口
 * - warning：出库后低于安全库存 -> 可批准，但必须填写原因
 */
export function buildApprovalPlan(
  order: DispatchOrder,
  warehouses: Warehouse[],
  batches: InventoryBatch[],
  items: SupplyItem[]
): ApprovalPlan {
  const warehouse = warehouses.find((w) => w.id === order.source_warehouse_id);
  const warehouseActive = warehouse?.status === "ACTIVE";
  const blockingReasons: string[] = [];
  const warningReasons: string[] = [];

  if (!warehouse) {
    blockingReasons.push(`来源仓库不存在（id=${order.source_warehouse_id}），请重新选择`);
  } else if (!warehouseActive) {
    blockingReasons.push(
      formatMessage(ERROR_MESSAGES.WAREHOUSE_DISABLED, { warehouse: warehouse.name }) +
        (warehouse.disabled_reason ? `：${warehouse.disabled_reason}` : "")
    );
  }

  const sourceBatches = warehouseActive
    ? batches.filter((b) => b.warehouse_id === order.source_warehouse_id)
    : [];

  const linePlans = order.lines.map((line) =>
    buildLinePlan(order.id, line.supply_item_id, line.quantity, sourceBatches, items)
  );

  if (warehouseActive) {
    for (const plan of linePlans) {
      const item = supplyName(items, plan.supply_item_id);
      if (plan.gap_quantity > 0) {
        const excludedParts: string[] = [];
        if (plan.excluded_expired_quantity > 0) {
          excludedParts.push(`已过期批次 ${plan.excluded_expired_quantity}${item?.unit ?? ""}不可用`);
        }
        if (plan.excluded_quarantined_quantity > 0) {
          excludedParts.push(`隔离冻结 ${plan.excluded_quarantined_quantity}${item?.unit ?? ""}不可用`);
        }
        blockingReasons.push(
          formatMessage(ERROR_MESSAGES.INSUFFICIENT_BATCH_STOCK, {
            supply: item?.name ?? `#${plan.supply_item_id}`,
            gap: plan.gap_quantity,
            unit: item?.unit ?? ""
          }) + (excludedParts.length ? `（${excludedParts.join("，")}）` : "")
        );
      }
      if (plan.below_safety_after && plan.gap_quantity === 0) {
        warningReasons.push(
          formatMessage(ERROR_MESSAGES.BELOW_SAFETY_STOCK, {
            supply: item?.name ?? `#${plan.supply_item_id}`,
            remaining: plan.post_remaining,
            safety: plan.safety_stock,
            unit: item?.unit ?? ""
          })
        );
      }
    }
  }

  return {
    order_id: order.id,
    warehouse_id: order.source_warehouse_id,
    warehouse_active: warehouseActive,
    approvable: blockingReasons.length === 0,
    has_warning: warningReasons.length > 0,
    blocking_reasons: blockingReasons,
    warning_reasons: warningReasons,
    line_plans: linePlans
  };
}
