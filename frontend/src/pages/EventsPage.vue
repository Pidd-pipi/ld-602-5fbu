<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { loadSnapshot, type PersistSnapshot } from "../services/localRepository";
import StatusBadge from "../components/common/StatusBadge.vue";
import ApprovalTimeline from "../components/common/ApprovalTimeline.vue";
import StatCard from "../components/common/StatCard.vue";

const snapshot = ref<PersistSnapshot | null>(null);
onMounted(() => (snapshot.value = loadSnapshot()));

interface EventGroup {
  eventId: number;
  eventName: string;
  orders: PersistSnapshot["dispatchOrder"];
}

const eventGroups = computed<EventGroup[]>(() => {
  const map = new Map<number, EventGroup>();
  for (const order of snapshot.value?.dispatchOrder ?? []) {
    if (!map.has(order.event_id)) {
      map.set(order.event_id, { eventId: order.event_id, eventName: order.event_name, orders: [] });
    }
    map.get(order.event_id)!.orders.push(order);
  }
  return [...map.values()];
});

const receivedCount = computed(
  () => (snapshot.value?.dispatchOrder ?? []).filter((order) => order.status === "RECEIVED").length
);
const inFlightCount = computed(
  () => (snapshot.value?.dispatchOrder ?? []).filter((order) => ["APPROVED", "DISPATCHED"].includes(order.status)).length
);
</script>

<template>
  <section v-if="snapshot" class="events-page">
    <section class="metrics">
      <StatCard label="在办事件" :value="eventGroups.length" />
      <StatCard label="调拨中（已批准/已出库）" :value="inFlightCount" />
      <StatCard label="已完成签收" :value="receivedCount" />
    </section>

    <div v-for="group in eventGroups" :key="group.eventId" class="panel event-card">
      <h2>{{ group.eventName }}</h2>
      <div class="event-orders">
        <article v-for="order in group.orders" :key="order.id" class="event-order">
          <header>
            <div>
              <strong class="mono">{{ order.order_no }}</strong>
              <p class="sub">{{ order.source_warehouse_name }} → {{ order.shelter_name }}</p>
            </div>
            <StatusBadge :value="order.status" kind="dispatch" />
          </header>
          <ApprovalTimeline :order="order" />
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.events-page { display: grid; gap: 14px; }
.event-orders { display: grid; gap: 12px; }
.event-order { border: 1px solid #e1ddcf; border-radius: 8px; padding: 14px; background: #fff; }
.event-order header { display: flex; justify-content: space-between; margin-bottom: 8px; }
</style>
