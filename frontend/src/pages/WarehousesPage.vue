<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { loadSnapshot, type PersistSnapshot } from "../services/localRepository";
import StatusBadge from "../components/common/StatusBadge.vue";
import BatchTable, { type BatchTableRow } from "../components/common/BatchTable.vue";
import { formatExpireTag, formatNumber } from "../utils/formatters";

const snapshot = ref<PersistSnapshot | null>(null);
const selectedWarehouseId = ref<number>(1);
const onlyNearExpire = ref(false);

onMounted(() => {
  snapshot.value = loadSnapshot();
  selectedWarehouseId.value = snapshot.value.warehouse.find((entry) => entry.status === "ACTIVE")?.id ?? 1;
});

const selectedWarehouse = computed(() =>
  snapshot.value?.warehouse.find((entry) => entry.id === selectedWarehouseId.value)
);

interface WarehouseBatchView extends BatchTableRow {
  quality_status: string;
}

const batchRows = computed<WarehouseBatchView[]>(() => {
  if (!snapshot.value || !selectedWarehouse.value) return [];
  return snapshot.value.inventoryBatch
    .filter((batch) => batch.warehouse_id === selectedWarehouseId.value)
    .filter((batch) => (onlyNearExpire.value ? (new Date(batch.expire_at).getTime() - Date.now()) / 86400000 <= 30 : true))
    .map((batch) => {
      const item = snapshot.value!.supplyItem.find((entry) => entry.id === batch.supply_item_id);
      const days = (new Date(batch.expire_at).getTime() - Date.now()) / 86400000;
      return {
        batch_id: batch.id,
        batch_no: batch.batch_no,
        expire_at: batch.expire_at,
        available_quantity: batch.quantity,
        allocated_quantity: 0,
        near_expire: days >= 0 && days <= 30,
        quality_status: batch.quality_status,
        unit: item?.unit ?? ""
      };
    })
    .sort((a, b) => new Date(a.expire_at).getTime() - new Date(b.expire_at).getTime());
});

const inventorySummary = computed(() => {
  if (!snapshot.value) return [];
  return snapshot.value.supplyItem
    .map((item) => {
      const batches = snapshot.value!.inventoryBatch.filter(
        (batch) => batch.warehouse_id === selectedWarehouseId.value && batch.supply_item_id === item.id
      );
      const total = batches.reduce((sum, batch) => sum + batch.quantity, 0);
      return { item, total, batches: batches.length, below: total < item.safety_stock };
    })
    .filter((entry) => entry.batches > 0);
});
</script>

<template>
  <section v-if="snapshot" class="warehouses-page">
    <div class="warehouse-tabs">
      <button
        v-for="warehouse in snapshot.warehouse"
        :key="warehouse.id"
        :class="{ active: warehouse.id === selectedWarehouseId }"
        @click="selectedWarehouseId = warehouse.id"
      >
        {{ warehouse.name }}
        <StatusBadge :value="warehouse.status" kind="warehouse" />
      </button>
    </div>

    <div v-if="selectedWarehouse" class="panel warehouse-head">
      <div>
        <h2>{{ selectedWarehouse.name }}</h2>
        <p class="sub">{{ selectedWarehouse.district }} · {{ selectedWarehouse.address }} · 容量等级 {{ selectedWarehouse.capacity_level }} · 联系电话 {{ selectedWarehouse.contact_phone }}</p>
      </div>
      <StatusBadge :value="selectedWarehouse.status" kind="warehouse" />
    </div>

    <div class="metrics">
      <div class="stat" v-for="entry in inventorySummary" :key="entry.item.id">
        <span>{{ entry.item.name }}（安全库存 {{ entry.item.safety_stock }} {{ entry.item.unit }}）</span>
        <strong :class="{ danger: entry.below }">{{ formatNumber(entry.total) }} {{ entry.item.unit }}</strong>
        <span class="sub">{{ entry.batches }} 个批次<template v-if="entry.below"> · <strong class="danger">已低于安全库存</strong></template></span>
      </div>
    </div>

    <div class="panel">
      <div class="batch-filter">
        <h2>库存批次</h2>
        <label><input type="checkbox" v-model="onlyNearExpire" /> 只看 30 天内临期/过期</label>
      </div>
      <p class="sub" v-if="batchRows.some((row) => row.quality_status === 'NEAR_EXPIRE')">
        提示：调拨审批时按 {{ formatExpireTag(batchRows.find((row) => row.quality_status === 'NEAR_EXPIRE')!.expire_at) }} 等临期批次优先出（FEFO）。
      </p>
      <BatchTable :rows="batchRows" mode="plan" empty-text="当前筛选条件下没有批次" />
    </div>
  </section>
</template>

<style scoped>
.warehouses-page { display: grid; gap: 14px; }
.warehouse-tabs { display: flex; gap: 8px; flex-wrap: wrap; }
.warehouse-tabs button { border: 1px solid #c4c0b1; background: #fbfaf4; border-radius: 8px; padding: 8px 12px; cursor: pointer; display: inline-flex; gap: 8px; align-items: center; }
.warehouse-tabs button.active { border-color: #274335; box-shadow: inset 0 0 0 1px #274335; }
.warehouse-head { display: flex; justify-content: space-between; align-items: center; }
.batch-filter { display: flex; justify-content: space-between; align-items: center; }
.danger { color: #9c2a1c; }
</style>
