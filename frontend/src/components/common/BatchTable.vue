<script setup lang="ts">
import { computed } from "vue";
import StatusBadge from "./StatusBadge.vue";
import { formatDay, formatExpireTag, formatNumber } from "../../utils/formatters";

/** 批次行：既支持来源仓库存试算，也支持批准后锁定的 FEFO 分配结果 */
export interface BatchTableRow {
  batch_id: number;
  batch_no: string;
  expire_at: string;
  available_quantity: number;
  allocated_quantity?: number;
  near_expire: boolean;
  quality_status?: string;
  unit: string;
}

const props = withDefaults(
  defineProps<{
    rows: BatchTableRow[];
    supplyName?: string;
    /** plan=审批试算（展示余量与建议出库量）；result=批准后方案/出库结果 */
    mode?: "plan" | "result";
    emptyText?: string;
  }>(),
  { mode: "plan", supplyName: "", emptyText: "该来源仓库暂无可供调拨的有效批次（过期/破损批次已排除）" }
);

const sortedRows = computed(() =>
  [...props.rows].sort((a, b) => new Date(a.expire_at).getTime() - new Date(b.expire_at).getTime())
);

function quality(row: BatchTableRow): string {
  if (row.quality_status) return row.quality_status;
  const days = (new Date(row.expire_at).getTime() - Date.now()) / (24 * 60 * 60 * 1000);
  if (days < 0) return "EXPIRED";
  if (days <= 30) return "NEAR_EXPIRE";
  return "QUALIFIED";
}
</script>

<template>
  <div class="batch-table">
    <table v-if="sortedRows.length">
      <thead>
        <tr>
          <th>批次号</th>
          <th>到期日</th>
          <th>剩余量</th>
          <th v-if="mode === 'plan'">建议出库(FEFO)</th>
          <th v-else>本次出库</th>
          <th>批次状态</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in sortedRows" :key="row.batch_id" :class="{ 'row-near': row.near_expire, 'row-expired': quality(row) === 'EXPIRED' }">
          <td class="mono">{{ row.batch_no }}</td>
          <td>
            {{ formatDay(row.expire_at) }}
            <span class="expire-tag" :class="{ 'tag-near': row.near_expire, 'tag-expired': quality(row) === 'EXPIRED' }">
              {{ formatExpireTag(row.expire_at) }}
            </span>
          </td>
          <td>{{ formatNumber(row.available_quantity) }} {{ row.unit }}</td>
          <td>
            <strong v-if="(row.allocated_quantity ?? 0) > 0">{{ formatNumber(row.allocated_quantity ?? 0) }} {{ row.unit }}</strong>
            <span v-else class="muted">不动用</span>
            <span v-if="row.near_expire && (row.allocated_quantity ?? 0) > 0" class="fefo-flag">先出临期</span>
          </td>
          <td><StatusBadge :value="quality(row)" kind="quality" /></td>
        </tr>
      </tbody>
    </table>
    <p v-else class="batch-empty">{{ emptyText }}</p>
  </div>
</template>
