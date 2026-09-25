<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useWarehouseStore } from "../stores/WarehouseStore";
import { useInventoryBatchStore } from "../stores/InventoryBatchStore";
import { useSupplyItemStore } from "../stores/SupplyItemStore";
import { useDispatchOrderStore } from "../stores/DispatchOrderStore";
import { useExpireWarning } from "../hooks/useExpireWarning";
import StatCard from "../components/common/StatCard.vue";
import StatusBadge from "../components/common/StatusBadge.vue";
import ExpireWarningList from "../components/common/ExpireWarningList.vue";
import EmptyState from "../components/common/EmptyState.vue";
import { formatDateTime } from "../utils/formatters";
import { DispatchStatusStep } from "../constants/DispatchStatus";

const warehouseStore = useWarehouseStore();
const batchStore = useInventoryBatchStore();
const supplyStore = useSupplyItemStore();
const dispatchStore = useDispatchOrderStore();
const router = useRouter();

const totalRemaining = computed(() =>
  batchStore.rows
    .filter((b) => b.quality_status !== "EXPIRED" && b.quality_status !== "QUARANTINED")
    .reduce((sum, b) => sum + b.remaining_quantity, 0)
);
const pendingOrders = computed(() =>
  [...dispatchStore.rows]
    .filter((o) => o.status === "SUBMITTED")
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
);
const gapOrders = computed(() => dispatchStore.rows.filter((o) => o.blocking_reasons.length > 0));
const activeOrders = computed(() =>
  [...dispatchStore.rows]
    .filter((o) => ["APPROVED", "DISPATCHED", "RECEIVED"].includes(o.status))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 6)
);

const { warningRows, nearCount, expiredCount } = useExpireWarning(() => batchStore.rows);
const itemNameOf = (id: number) => supplyStore.byId(id)?.name ?? `物资#${id}`;
const warehouseNameOf = (id: number) => warehouseStore.byId(id)?.name ?? `仓库#${id}`;
const stepPercent = (status: string) => `${(DispatchStatusStep[status as keyof typeof DispatchStatusStep] ?? 0) * 25}%`;

const goDispatch = () => router.push("/dispatch");
const goWarehouses = () => router.push("/warehouses");

onMounted(async () => {
  await Promise.all([warehouseStore.load(), batchStore.load(), supplyStore.load(), dispatchStore.load()]);
});
</script>

<template>
  <section class="page-dashboard">
    <div class="metrics">
      <StatCard label="启用仓库" :value="warehouseStore.activeRows.length" :sub="`共 ${warehouseStore.rows.length} 个，停用 ${warehouseStore.rows.length - warehouseStore.activeRows.length}`" />
      <StatCard label="批次可用库存总量" :value="totalRemaining" :sub="`临期 ${nearCount} 批 · 过期 ${expiredCount} 批`" :tone="nearCount + expiredCount ? 'warn' : ''" />
      <StatCard label="待审批调拨单" :value="pendingOrders.length" :sub="`其中缺口/停用拦截 ${gapOrders.length} 单`" :tone="gapOrders.length ? 'danger' : ''" />
      <StatCard label="进行中/已完成调拨" :value="activeOrders.length" sub="已批准 · 已出库 · 已签收" />
    </div>

    <div class="dash-grid">
      <div class="panel">
        <div class="panel-head">
          <h3>待审批调拨（点击进入审批）</h3>
          <button class="btn btn-ghost btn-sm" @click="goDispatch">全部调拨单 →</button>
        </div>
        <EmptyState v-if="pendingOrders.length === 0" text="当前没有待审批调拨单" />
        <article
          v-for="order in pendingOrders"
          :key="order.id"
          class="pending-item"
          :class="{ blocked: order.blocking_reasons.length }"
          @click="goDispatch"
        >
          <div class="pending-main">
            <strong>{{ order.order_no }}</strong>
            <span>{{ order.event_name }}</span>
            <small class="muted">{{ warehouseNameOf(order.source_warehouse_id) }} · {{ formatDateTime(order.created_at) }}</small>
          </div>
          <div class="pending-side">
            <StatusBadge :value="order.priority" kind="priority" size="sm" />
            <span v-if="order.blocking_reasons.length" class="check-tag check-block">缺口/停用拦截</span>
            <span v-else-if="order.warning_reasons.length" class="check-tag check-warn">低于安全库存</span>
            <span v-else class="check-tag check-ok">可批准</span>
          </div>
        </article>
      </div>

      <div class="panel">
        <div class="panel-head">
          <h3>临期 / 过期批次（FEFO 优先出）</h3>
          <button class="btn btn-ghost btn-sm" @click="goWarehouses">仓库库存 →</button>
        </div>
        <ExpireWarningList :rows="warningRows" :item-name-of="itemNameOf" :warehouse-name-of="warehouseNameOf" />
      </div>
    </div>

    <div class="panel">
      <h3>事件响应进度</h3>
      <EmptyState v-if="activeOrders.length === 0" text="暂无进行中的调拨" />
      <div v-for="order in activeOrders" :key="order.id" class="progress-row" @click="goDispatch">
        <div class="progress-info">
          <strong>{{ order.event_name }}</strong>
          <span class="muted">{{ order.order_no }} · {{ warehouseNameOf(order.source_warehouse_id) }} → 避难点#{{ order.shelter_id }}</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" :class="`fill-${order.status.toLowerCase()}`" :style="{ width: stepPercent(order.status) }" />
          <ol class="progress-steps">
            <li :class="{ done: DispatchStatusStep[order.status] >= 1 }">待审批</li>
            <li :class="{ done: DispatchStatusStep[order.status] >= 2 }">已批准</li>
            <li :class="{ done: DispatchStatusStep[order.status] >= 3 }">已出库</li>
            <li :class="{ done: DispatchStatusStep[order.status] >= 4 }">已签收</li>
          </ol>
        </div>
        <StatusBadge :value="order.status" kind="dispatch" size="sm" />
      </div>
    </div>
  </section>
</template>
