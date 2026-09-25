<script setup lang="ts">
import { computed } from "vue";
import type { InventoryBatch } from "../../types/InventoryBatch";
import StatusBadge from "./StatusBadge.vue";
import EmptyState from "./EmptyState.vue";
import { formatDate, formatExpireLabel, daysUntil, formatNumber } from "../../utils/formatters";

/**
 * 批次表格（仓库库存页 / 调拨审批详情共用）：
 * - 仓库视图：看批次剩余量、到期日、临期/过期状态；
 * - 分配视图：feOrder 给出批准时的 FEFO 出库顺序与本批分配量。
 */
export interface BatchTableRow {
  batch: InventoryBatch;
  itemName?: string;
  unit?: string;
  /** FEFO 出库顺序（从 1 开始），0/缺省表示仅展示不参与分配 */
  fefoOrder?: number;
  allocateQuantity?: number;
  /** 不参与分配的原因（已过期/隔离/仓库停用） */
  excludedReason?: string;
}

const props = withDefaults(
  defineProps<{
    rows: BatchTableRow[];
    showAllocate?: boolean;
    emptyText?: string;
    compact?: boolean;
  }>(),
  { showAllocate: false, emptyText: "该仓库暂无批次库存", compact: false }
);

const sortedRows = computed(() =>
  [...props.rows].sort((a, b) => {
    // 有 FEFO 顺序的按顺序；其余按到期日
    if (a.fefoOrder && b.fefoOrder) return a.fefoOrder - b.fefoOrder;
    if (a.fefoOrder) return -1;
    if (b.fefoOrder) return 1;
    return new Date(a.batch.expire_at).getTime() - new Date(b.batch.expire_at).getTime();
  })
);

const rowClass = (row: BatchTableRow) => {
  const days = daysUntil(row.batch.expire_at);
  if (row.excludedReason) return "row-excluded";
  if (row.batch.quality_status === "EXPIRED" || days < 0) return "row-expired";
  if (row.batch.quality_status === "NEAR_EXPIRY") return "row-near";
  if (row.fefoOrder) return "row-allocated";
  return "";
};
</script>

<template>
  <div class="batch-table-wrap">
    <table class="batch-table" :class="{ compact }">
      <thead>
        <tr>
          <th v-if="showAllocate" class="col-order">出库顺序</th>
          <th>批次号</th>
          <th v-if="!compact">物资</th>
          <th class="col-num">剩余量</th>
          <th class="col-num" v-if="showAllocate">本次出库</th>
          <th>到期日</th>
          <th>状态</th>
          <th v-if="!compact">来源 / 说明</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in sortedRows" :key="row.batch.id" :class="rowClass(row)">
          <td v-if="showAllocate" class="col-order">
            <span v-if="row.fefoOrder" class="fefo-no">{{ row.fefoOrder }}</span>
            <span v-else class="fefo-skip">—</span>
          </td>
          <td class="batch-no">{{ row.batch.batch_no }}</td>
          <td v-if="!compact">{{ row.itemName ?? `物资#${row.batch.supply_item_id}` }}</td>
          <td class="col-num">
            <strong>{{ formatNumber(row.batch.remaining_quantity) }}</strong>
            <em v-if="row.unit">{{ row.unit }}</em>
          </td>
          <td v-if="showAllocate" class="col-num">
            <span v-if="row.allocateQuantity" class="alloc-qty">
              {{ formatNumber(row.allocateQuantity) }}<em v-if="row.unit">{{ row.unit }}</em>
            </span>
            <span v-else class="muted">不出</span>
          </td>
          <td>
            <div>{{ formatDate(row.batch.expire_at) }}</div>
            <small :class="daysUntil(row.batch.expire_at) < 0 ? 'text-danger' : 'text-warn'">
              {{ formatExpireLabel(row.batch.expire_at) }}
            </small>
          </td>
          <td><StatusBadge :value="row.batch.quality_status" kind="quality" size="sm" /></td>
          <td v-if="!compact" class="muted-cell">
            <div>{{ row.batch.inbound_source }}</div>
            <small v-if="row.excludedReason" class="text-danger">{{ row.excludedReason }}</small>
          </td>
        </tr>
      </tbody>
    </table>
    <EmptyState v-if="sortedRows.length === 0" :text="emptyText" />
  </div>
</template>
