<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useWarehouseStore } from "../stores/WarehouseStore";
import { useInventoryBatchStore } from "../stores/InventoryBatchStore";
import { useSupplyItemStore } from "../stores/SupplyItemStore";
import { useSessionStore } from "../stores/SessionStore";
import { useExpireWarning } from "../hooks/useExpireWarning";
import StatusBadge from "../components/common/StatusBadge.vue";
import BatchTable, { type BatchTableRow } from "../components/common/BatchTable.vue";
import EmptyState from "../components/common/EmptyState.vue";

const warehouseStore = useWarehouseStore();
const batchStore = useInventoryBatchStore();
const supplyStore = useSupplyItemStore();
const session = useSessionStore();

const selectedWarehouseId = ref<number>(1);
const onlyNearExpiry = ref(false);
const stopReasonVisible = ref(false);
const stopReason = ref("");

const selectedWarehouse = computed(
  () => warehouseStore.byId(selectedWarehouseId.value)
);

const itemNameOf = (id: number) => supplyStore.byId(id)?.name ?? `物资#${id}`;
const unitOf = (id: number) => supplyStore.byId(id)?.unit ?? "";

const batchesOfSelected = computed(() =>
  batchStore.rows.filter((b) => b.warehouse_id === selectedWarehouseId.value)
);

const { warningRows, nearCount, expiredCount } = useExpireWarning(() => batchesOfSelected.value);
void warningRows;

const tableRows = computed<BatchTableRow[]>(() =>
  batchesOfSelected.value
    .filter((b) => (onlyNearExpiry.value ? b.quality_status !== "QUALIFIED" : true))
    .map((batch) => ({
      batch,
      itemName: itemNameOf(batch.supply_item_id),
      unit: unitOf(batch.supply_item_id),
      excludedReason:
        batch.quality_status === "EXPIRED"
          ? "已过期，不参与调拨分配"
          : batch.quality_status === "QUARANTINED"
            ? "隔离冻结，等待质检"
            : undefined
    }))
);

const stockSummary = computed(() => {
  const map = new Map<number, { remaining: number; safety: number; unit: string; name: string }>();
  for (const batch of batchesOfSelected.value) {
    const item = supplyStore.byId(batch.supply_item_id);
    const cur = map.get(batch.supply_item_id) ?? {
      remaining: 0,
      safety: item?.safety_stock ?? 0,
      unit: item?.unit ?? "",
      name: item?.name ?? `物资#${batch.supply_item_id}`
    };
    if (batch.quality_status !== "EXPIRED" && batch.quality_status !== "QUARANTINED") {
      cur.remaining += batch.remaining_quantity;
    }
    map.set(batch.supply_item_id, cur);
  }
  return [...map.values()];
});

const selectWarehouse = (id: number) => {
  selectedWarehouseId.value = id;
};

const openStopDialog = () => {
  stopReason.value = selectedWarehouse.value?.disabled_reason ?? "";
  stopReasonVisible.value = true;
};

const submitToggle = async () => {
  try {
    await warehouseStore.toggleStatus(selectedWarehouseId.value, stopReason.value);
    stopReasonVisible.value = false;
  } catch (error) {
    stopReason.value = error instanceof Error ? error.message : stopReason.value;
  }
};

onMounted(async () => {
  await Promise.all([warehouseStore.load(), batchStore.load(), supplyStore.load()]);
  selectedWarehouseId.value = warehouseStore.rows[0]?.id ?? 1;
});
</script>

<template>
  <section class="page-warehouses">
    <header class="content-head">
      <div>
        <p class="eyebrow">Warehouse Inventory</p>
        <h2>仓库库存</h2>
      </div>
      <button
        v-if="session.can('toggleWarehouse') && selectedWarehouse"
        class="btn"
        :class="selectedWarehouse.status === 'ACTIVE' ? 'btn-danger' : 'btn-primary'"
        @click="openStopDialog"
      >
        {{ selectedWarehouse.status === "ACTIVE" ? "停用该仓库（需填原因）" : "重新启用仓库" }}
      </button>
    </header>

    <div class="warehouse-layout">
      <div class="warehouse-list panel">
        <h3>仓库列表</h3>
        <button
          v-for="w in warehouseStore.rows"
          :key="w.id"
          class="warehouse-card"
          :class="{ active: w.id === selectedWarehouseId, disabled: w.status === 'DISABLED' }"
          @click="selectWarehouse(w.id)"
        >
          <div class="warehouse-card-head">
            <strong>{{ w.name }}</strong>
            <StatusBadge :value="w.status" kind="warehouse" size="sm" />
          </div>
          <small>{{ w.district }} · 容量等级 {{ w.capacity_level }} · 仓管 {{ w.manager_name }}</small>
          <small v-if="w.status === 'DISABLED'" class="text-danger stop-reason">停用原因：{{ w.disabled_reason }}</small>
        </button>
      </div>

      <div class="warehouse-detail">
        <div v-if="selectedWarehouse" class="panel">
          <div class="detail-title-row">
            <div>
              <h3>{{ selectedWarehouse.name }}</h3>
              <p class="muted">{{ selectedWarehouse.address }} · {{ selectedWarehouse.contact_phone }}</p>
            </div>
            <label class="check-filter">
              <input type="checkbox" v-model="onlyNearExpiry" />
              只看临期/异常批次（临期 {{ nearCount }} · 过期 {{ expiredCount }}）
            </label>
          </div>

          <div v-if="selectedWarehouse.status === 'DISABLED'" class="alert alert-block mb">
            仓库已停用：{{ selectedWarehouse.disabled_reason }}。停用期间所有来自该仓的调拨单无法批准。
          </div>

          <h4 class="section-label">物资可用量 vs 安全库存</h4>
          <div class="safety-grid">
            <div v-for="s in stockSummary" :key="s.name" class="safety-item" :class="{ below: s.remaining < s.safety }">
              <strong>{{ s.name }}</strong>
              <span>{{ s.remaining }} / 安全 {{ s.safety }}{{ s.unit }}</span>
            </div>
            <EmptyState v-if="stockSummary.length === 0" text="该仓库暂无库存" />
          </div>

          <h4 class="section-label">批次明细（按到期日排序）</h4>
          <BatchTable :rows="tableRows" empty-text="该仓库暂无批次" />
        </div>
      </div>
    </div>

    <div v-if="stopReasonVisible" class="modal-mask" @click.self="stopReasonVisible = false">
      <div class="modal modal-sm">
        <header class="modal-head"><h3>{{ selectedWarehouse?.status === "ACTIVE" ? "停用仓库" : "重新启用" }}</h3><button class="icon-btn" @click="stopReasonVisible = false">✕</button></header>
        <div class="modal-body">
          <template v-if="selectedWarehouse?.status === 'ACTIVE'">
            <p class="muted">停用后，来自该仓库的待审批调拨单会被拦截并保持待审。请填写停用原因：</p>
            <textarea v-model="stopReason" rows="3" placeholder="如：库房消防整改，暂停一切调拨，预计 15 天"></textarea>
            <button class="btn btn-danger" :disabled="stopReason.trim().length < 4" @click="submitToggle">确认停用</button>
          </template>
          <template v-else>
            <p class="muted">确认重新启用「{{ selectedWarehouse?.name }}」？启用后该仓批次恢复参与 FEFO 分配。</p>
            <button class="btn btn-primary" @click="stopReason = ''; submitToggle()">确认启用</button>
          </template>
        </div>
      </div>
    </div>
  </section>
</template>
