<script setup lang="ts">
import { computed } from "vue";
import { formatExpireTag, formatNumber } from "../../utils/formatters";
import StatusBadge from "./StatusBadge.vue";
import type { InventoryBatch } from "../../types/InventoryBatch";
import type { SupplyItem } from "../../types/SupplyItem";
import type { Warehouse } from "../../types/Warehouse";

const props = defineProps<{
  batches: InventoryBatch[];
  items: SupplyItem[];
  warehouses?: Warehouse[];
  limit?: number;
}>();

const rows = computed(() => {
  const itemMap = new Map(props.items.map((item) => [item.id, item]));
  const warehouseMap = new Map((props.warehouses ?? []).map((entry) => [entry.id, entry]));
  return [...props.batches]
    .filter((batch) => {
      const days = (new Date(batch.expire_at).getTime() - Date.now()) / (24 * 60 * 60 * 1000);
      return days <= 30;
    })
    .sort((a, b) => new Date(a.expire_at).getTime() - new Date(b.expire_at).getTime())
    .slice(0, props.limit ?? 8)
    .map((batch) => ({
      batch,
      item: itemMap.get(batch.supply_item_id),
      warehouse: warehouseMap.get(batch.warehouse_id)
    }));
});
</script>

<template>
  <div class="panel expire-panel">
    <h2>临期 / 过期批次预警</h2>
    <table v-if="rows.length" class="expire-table">
      <thead><tr><th>物资 / 批次</th><th>仓库</th><th>余量</th><th>到期</th></tr></thead>
      <tbody>
        <tr v-for="{ batch, item, warehouse } in rows" :key="batch.id">
          <td>
            <strong>{{ item?.name ?? `物资 #${batch.supply_item_id}` }}</strong>
            <span class="sub mono">{{ batch.batch_no }}</span>
          </td>
          <td>{{ warehouse?.name ?? `仓库 #${batch.warehouse_id}` }}</td>
          <td>{{ formatNumber(batch.quantity) }} {{ item?.unit ?? "" }}</td>
          <td>
            <StatusBadge :value="batch.quality_status" kind="quality" />
            <span class="sub">{{ formatExpireTag(batch.expire_at) }}</span>
          </td>
        </tr>
      </tbody>
    </table>
    <p v-else class="sub">30 天内没有临期批次。</p>
  </div>
</template>
