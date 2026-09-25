import { NEAR_EXPIRE_DAYS } from "../constants/DispatchRule";
import { ERROR_MESSAGES } from "../constants/errorMessages";
import type { DispatchBlockReason, DispatchLine, DispatchLineGap, DispatchBatchAllocation } from "../types/DispatchOrder";
import type { InventoryBatch } from "../types/InventoryBatch";
import type { SupplyItem } from "../types/SupplyItem";
import type { Warehouse } from "../types/Warehouse";

const DAY_MS = 24 * 60 * 60 * 1000;

export function isNearExpire(expireAt: string, now: Date = new Date()): boolean {
  const days = (new Date(expireAt).getTime() - now.getTime()) / DAY_MS;
  return days >= 0 && days <= NEAR_EXPIRE_DAYS;
}

export function isExpired(expireAt: string, now: Date = new Date()): boolean {
  return new Date(expireAt).getTime() < now.getTime();
}

function render(template: string, params: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(params[key] ?? `{${key}}`));
}

/** 仅合格/临期批次可用于调拨；过期、破损批次排除 */
export function isAllocatableBatch(batch: InventoryBatch, now: Date = new Date()): boolean {
  return batch.quality_status !== "EXPIRED" && batch.quality_status !== "DAMAGED" && !isExpired(batch.expire_at, now);
}

export interface DispatchPlanLine {
  line: DispatchLine;
  item: SupplyItem;
  allocations: DispatchBatchAllocation[];
  allocatedTotal: number;
  gap?: DispatchLineGap;
}

export interface DispatchPlan {
  warehouse: Warehouse | undefined;
  warehouseDisabled: boolean;
  lines: DispatchPlanLine[];
  gaps: DispatchLineGap[];
  /** 仓库停用为 ERROR；出库将跌破安全库存为 WARNING，需要调度员写明原因 */
  blockReasons: DispatchBlockReason[];
  /** 存在 ERROR 或缺口时不可批准 */
  canApprove: boolean;
  /** 无缺口但会跌破安全库存：批准时必须填写说明 */
  requireSafetyReason: boolean;
}

/**
 * 按 FEFO（First Expired First Out）为每条明细分配批次：
 * 先出到期日最近的临期批次，不足再顺延后续批次。
 * 同时核算缺口与来源仓库停用、安全库存等阻塞原因。
 */
export function buildDispatchPlan(
  order: { source_warehouse_id: number; lines: DispatchLine[] },
  batches: InventoryBatch[],
  items: SupplyItem[],
  warehouses: Warehouse[],
  now: Date = new Date()
): DispatchPlan {
  const warehouse = warehouses.find((entry) => entry.id === order.source_warehouse_id);
  const warehouseDisabled = warehouse?.status === "DISABLED";

  const blockReasons: DispatchBlockReason[] = [];
  if (!warehouse || warehouseDisabled) {
    blockReasons.push({
      level: "ERROR",
      code: "WAREHOUSE_DISABLED",
      message: render(ERROR_MESSAGES.DISPATCH_WAREHOUSE_DISABLED, { warehouse: warehouse?.name ?? "未知仓库" })
    });
  }

  const gaps: DispatchLineGap[] = [];
  const planLines: DispatchPlanLine[] = [];

  for (const line of order.lines) {
    const item = items.find((entry) => entry.id === line.supply_item_id);
    if (!item) continue;

    // 到期日升序：先临期批次，再出后续批次
    const candidates = batches
      .filter((batch) =>
        !warehouseDisabled &&
        batch.warehouse_id === order.source_warehouse_id &&
        batch.supply_item_id === item.id &&
        batch.quantity > 0 &&
        isAllocatableBatch(batch, now)
      )
      .sort((a, b) => new Date(a.expire_at).getTime() - new Date(b.expire_at).getTime());

    let remaining = line.requested_quantity;
    const allocations: DispatchBatchAllocation[] = candidates
      .map((batch) => {
        const take = Math.min(remaining, batch.quantity);
        remaining -= take;
        return {
          batch_id: batch.id,
          batch_no: batch.batch_no,
          expire_at: batch.expire_at,
          available_quantity: batch.quantity,
          allocated_quantity: take,
          near_expire: isNearExpire(batch.expire_at, now)
        } satisfies DispatchBatchAllocation;
      })
      .filter((allocation) => allocation.allocated_quantity > 0);

    const availableTotal = allocations.reduce((sum, entry) => sum + entry.available_quantity, 0);
    const allocatedTotal = line.requested_quantity - remaining;

    let gap: DispatchLineGap | undefined;
    if (remaining > 0 && !warehouseDisabled) {
      gap = {
        supply_item_id: item.id,
        supply_name: item.name,
        unit: item.unit,
        requested_quantity: line.requested_quantity,
        available_quantity: availableTotal,
        shortage_quantity: remaining
      };
      gaps.push(gap);
      blockReasons.push({
        level: "ERROR",
        code: "STOCK_SHORTAGE",
        message: render(ERROR_MESSAGES.DISPATCH_STOCK_SHORTAGE, {
          supply: item.name,
          shortage: remaining,
          unit: item.unit
        })
      });
    }

    planLines.push({ line, item, allocations, allocatedTotal, gap });
  }

  // 安全库存校验：按本次分配扣减后，该仓该物资的可用批次余量是否低于安全库存
  if (!warehouseDisabled) {
    for (const planLine of planLines) {
      if (planLine.gap) continue;
      const item = planLine.item;
      const remain = batches
        .filter(
          (batch) =>
            batch.warehouse_id === order.source_warehouse_id &&
            batch.supply_item_id === item.id &&
            isAllocatableBatch(batch, now)
        )
        .reduce((sum, batch) => sum + batch.quantity, 0) - planLine.allocatedTotal;
      if (remain < item.safety_stock) {
        blockReasons.push({
          level: "WARNING",
          code: "BELOW_SAFETY_STOCK",
          message: render(ERROR_MESSAGES.DISPATCH_BELOW_SAFETY, {
            warehouse: warehouse?.name ?? "未知仓库",
            supply: item.name,
            remain,
            safety: item.safety_stock,
            unit: item.unit
          })
        });
      }
    }
  }

  const hasError = blockReasons.some((reason) => reason.level === "ERROR");
  return {
    warehouse,
    warehouseDisabled,
    lines: planLines,
    gaps,
    blockReasons,
    canApprove: !hasError,
    requireSafetyReason: blockReasons.some((reason) => reason.code === "BELOW_SAFETY_STOCK")
  };
}
