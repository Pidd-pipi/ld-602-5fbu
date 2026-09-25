<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { loadSnapshot, type PersistSnapshot } from "../services/localRepository";
import StatCard from "../components/common/StatCard.vue";
import StatusBadge from "../components/common/StatusBadge.vue";
import ExpireWarningList from "../components/common/ExpireWarningList.vue";
import { formatDate } from "../utils/formatters";

const snapshot = ref<PersistSnapshot | null>(null);
onMounted(() => (snapshot.value = loadSnapshot()));

const pendingOrders = computed(() =>
  (snapshot.value?.dispatchOrder ?? []).filter((order) => order.status === "SUBMITTED")
);
const activeWarehouses = computed(() => (snapshot.value?.warehouse ?? []).filter((entry) => entry.status === "ACTIVE").length);
const totalBatches = computed(() => snapshot.value?.inventoryBatch.length ?? 0);
</script>

<template>
  <section v-if="snapshot">
    <section class="metrics">
      <StatCard label="启用仓库" :value="activeWarehouses" />
      <StatCard label="在管批次" :value="totalBatches" />
      <StatCard label="待审批调拨" :value="pendingOrders.length" />
    </section>

    <div class="workbench">
      <ExpireWarningList
        :batches="snapshot.inventoryBatch"
        :items="snapshot.supplyItem"
        :warehouses="snapshot.warehouse"
      />
      <div class="panel">
        <h2>待审批调拨</h2>
        <div v-for="order in pendingOrders" :key="order.id" class="pending-item">
          <div>
            <strong class="mono">{{ order.order_no }}</strong>
            <p class="sub">{{ order.source_warehouse_name }} → {{ order.shelter_name }}</p>
          </div>
          <div class="pending-meta">
            <StatusBadge value="SUBMITTED" kind="dispatch" />
            <span class="sub">{{ formatDate(order.requested_at) }}</span>
          </div>
        </div>
        <p v-if="!pendingOrders.length" class="sub">暂无待审批调拨单。</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.pending-item { display: flex; justify-content: space-between; gap: 10px; padding: 10px 0; border-top: 1px solid #e4e0d3; }
.pending-item:first-of-type { border-top: 0; }
.pending-meta { text-align: right; display: grid; gap: 4px; }
:deep(.expire-table) { width: 100%; border-collapse: collapse; }
:deep(.expire-table th) { text-align: left; font-size: 12px; color: #7a7566; padding: 6px 8px; }
:deep(.expire-table td) { padding: 8px; border-top: 1px solid #ece8da; font-size: 13px; }
</style>
