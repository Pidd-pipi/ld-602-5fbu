<script setup lang="ts">
import type { ExpireWarningRow } from "../../hooks/useExpireWarning";
import StatusBadge from "./StatusBadge.vue";
import EmptyState from "./EmptyState.vue";
import { formatDate, formatNumber } from "../../utils/formatters";

defineProps<{
  rows: ExpireWarningRow[];
  itemNameOf?: (id: number) => string;
  warehouseNameOf?: (id: number) => string;
}>();
</script>

<template>
  <div class="expire-list">
    <EmptyState v-if="rows.length === 0" text="30 天内暂无临期/过期批次" />
    <article v-for="row in rows" :key="row.batch.id" class="expire-item" :class="{ expired: row.level === 'expired' }">
      <div class="expire-main">
        <strong>{{ itemNameOf?.(row.batch.supply_item_id) ?? `物资#${row.batch.supply_item_id}` }}</strong>
        <span class="batch-no">{{ row.batch.batch_no }}</span>
        <small v-if="warehouseNameOf">{{ warehouseNameOf(row.batch.warehouse_id) }}</small>
      </div>
      <div class="expire-meta">
        <StatusBadge :value="row.batch.quality_status" kind="quality" size="sm" />
        <span class="expire-date">{{ formatDate(row.batch.expire_at) }}</span>
        <span class="expire-qty">剩 {{ formatNumber(row.batch.remaining_quantity) }}</span>
      </div>
    </article>
  </div>
</template>
