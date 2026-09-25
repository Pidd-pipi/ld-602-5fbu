import { computed } from "vue";
import type { InventoryBatch } from "../types/InventoryBatch";
import { isNearExpiry, daysUntil } from "../utils/formatters";

export interface ExpireWarningRow {
  batch: InventoryBatch;
  daysLeft: number;
  level: "expired" | "near";
}

/**
 * 临期预警：按到期日升序（最紧急在前），默认 30 天窗口。
 * 大屏、仓库页和调拨审批详情共用，保证“先出临期批次”的口径一致。
 */
export function useExpireWarning(batches: () => InventoryBatch[], windowDays = 30) {
  const warningRows = computed<ExpireWarningRow[]>(() =>
    batches()
      .map((batch) => ({ batch, daysLeft: daysUntil(batch.expire_at), level: "near" as const }))
      .filter((row) => row.batch.quality_status === "EXPIRED" || isNearExpiry(row.batch.expire_at, windowDays))
      .map((row) => ({
        ...row,
        level: row.batch.quality_status === "EXPIRED" || row.daysLeft < 0 ? ("expired" as const) : ("near" as const)
      }))
      .sort((a, b) => a.daysLeft - b.daysLeft)
  );

  const nearCount = computed(() => warningRows.value.filter((row) => row.level === "near").length);
  const expiredCount = computed(() => warningRows.value.filter((row) => row.level === "expired").length);

  return { warningRows, nearCount, expiredCount };
}
