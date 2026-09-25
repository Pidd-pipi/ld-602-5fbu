<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useDispatchOrderStore } from "../stores/DispatchOrderStore";
import { useWarehouseStore } from "../stores/WarehouseStore";
import { useShelterStore } from "../stores/ShelterStore";
import { useSupplyItemStore } from "../stores/SupplyItemStore";
import StatusBadge from "../components/common/StatusBadge.vue";
import ApprovalTimeline from "../components/common/ApprovalTimeline.vue";
import StatCard from "../components/common/StatCard.vue";
import EmptyState from "../components/common/EmptyState.vue";
import type { DispatchOrder } from "../types/DispatchOrder";
import { DispatchStatusStep } from "../constants/DispatchStatus";

const dispatchStore = useDispatchOrderStore();
const warehouseStore = useWarehouseStore();
const shelterStore = useShelterStore();
const supplyStore = useSupplyItemStore();
const router = useRouter();

interface EventGroup {
  eventName: string;
  orders: DispatchOrder[];
  maxStep: number;
  priority: DispatchOrder["priority"];
}

const eventGroups = computed<EventGroup[]>(() => {
  const map = new Map<string, DispatchOrder[]>();
  for (const order of dispatchStore.rows) {
    const list = map.get(order.event_name) ?? [];
    list.push(order);
    map.set(order.event_name, list);
  }
  return [...map.entries()]
    .map(([eventName, orders]): EventGroup => ({
      eventName,
      orders,
      maxStep: Math.max(...orders.map((o) => DispatchStatusStep[o.status] ?? 0)),
      priority: orders.some((o) => o.priority === "URGENT")
        ? "URGENT"
        : orders.some((o) => o.priority === "HIGH")
          ? "HIGH"
          : "NORMAL"
    }))
    .sort((a, b) => b.orders[0].id - a.orders[0].id);
});

const inTransit = computed(
  () => dispatchStore.rows.filter((o) => o.status === "DISPATCHED").length
);
const received = computed(
  () => dispatchStore.rows.filter((o) => o.status === "RECEIVED").length
);

const warehouseNameOf = (id: number) => warehouseStore.byId(id)?.name ?? `仓库#${id}`;
const shelterNameOf = (id: number) => shelterStore.byId(id)?.name ?? `避难点#${id}`;
const itemNameOf = (id: number) => supplyStore.byId(id)?.name ?? `物资#${id}`;
const unitOf = (id: number) => supplyStore.byId(id)?.unit ?? "";

const latestOrder = (group: EventGroup) =>
  [...group.orders].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

const stepLabel = (step: number) => ["提交", "待审批", "已批准", "已出库", "已签收"][step] ?? "提交";

onMounted(async () => {
  await Promise.all([dispatchStore.load(), warehouseStore.load(), shelterStore.load(), supplyStore.load()]);
});
</script>

<template>
  <section class="page-events">
    <div class="metrics">
      <StatCard label="在途调拨" :value="inTransit" sub="已出库等待签收" />
      <StatCard label="累计签收" :value="received" sub="避难点已确认收货" />
      <StatCard label="关联事件" :value="eventGroups.length" sub="按事件聚合调拨单" />
    </div>

    <EmptyState v-if="eventGroups.length === 0" text="暂无灾害事件与关联调拨" />

    <article v-for="group in eventGroups" :key="group.eventName" class="panel event-card">
      <header class="event-head">
        <div>
          <h3>{{ group.eventName }}</h3>
          <p class="muted">
            关联调拨 {{ group.orders.length }} 单 ·
            当前进度 <strong>{{ stepLabel(group.maxStep) }}</strong>
          </p>
        </div>
        <StatusBadge :value="group.priority" kind="priority" />
      </header>

      <div class="event-orders">
        <div v-for="order in group.orders" :key="order.id" class="event-order">
          <button class="link-btn order-link" @click="router.push('/dispatch')">{{ order.order_no }}</button>
          <small class="muted">{{ warehouseNameOf(order.source_warehouse_id) }} → {{ shelterNameOf(order.shelter_id) }}</small>
          <span v-for="line in order.lines" :key="line.id" class="line-chip">
            {{ itemNameOf(line.supply_item_id) }} ×{{ line.quantity }}{{ unitOf(line.supply_item_id) }}
          </span>
          <StatusBadge :value="order.status" kind="dispatch" size="sm" />
        </div>
      </div>

      <ApprovalTimeline :entries="latestOrder(group).timeline" />
    </article>
  </section>
</template>
