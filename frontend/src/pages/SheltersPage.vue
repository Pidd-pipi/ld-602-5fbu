<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { loadSnapshot, type PersistSnapshot } from "../services/localRepository";
import StatusBadge from "../components/common/StatusBadge.vue";
import CapacityMeter from "../components/common/CapacityMeter.vue";
import EmptyState from "../components/common/EmptyState.vue";
import { formatDate } from "../utils/formatters";
import { DispatchStatusText } from "../constants/DispatchStatus";
import { formatRisk } from "../utils/formatters";

const snapshot = ref<PersistSnapshot | null>(null);
onMounted(() => (snapshot.value = loadSnapshot()));

const shelterOrders = computed(() => {
  const map = new Map<number, { shelterName: string; orders: PersistSnapshot["dispatchOrder"] }>();
  for (const shelter of snapshot.value?.shelter ?? []) {
    map.set(shelter.id, {
      shelterName: shelter.name,
      orders: (snapshot.value?.dispatchOrder ?? [])
        .filter((order) => order.shelter_id === shelter.id)
        .sort((a, b) => b.requested_at.localeCompare(a.requested_at))
    });
  }
  return map;
});
</script>

<template>
  <section v-if="snapshot" class="shelters-page">
    <div v-for="shelter in snapshot.shelter" :key="shelter.id" class="panel shelter-card">
      <div class="shelter-main">
        <div class="shelter-head">
          <div>
            <h2>{{ shelter.name }}</h2>
            <p class="sub">{{ shelter.district }} · 联系人 {{ shelter.contact_person }} · 风险等级 {{ formatRisk(shelter.risk_level) }}</p>
          </div>
          <StatusBadge :value="shelter.open_status" kind="raw" />
        </div>
        <CapacityMeter :current="shelter.current_population" :capacity="shelter.capacity" />
      </div>
      <div class="shelter-records">
        <h3>调拨接收记录</h3>
        <div v-for="order in shelterOrders.get(shelter.id)?.orders ?? []" :key="order.id" class="record-row">
          <div>
            <strong class="mono">{{ order.order_no }}</strong>
            <span class="line-chip" v-for="line in order.lines" :key="line.id">
              {{ line.supply_name }} ×{{ line.requested_quantity }}{{ line.unit }}
            </span>
          </div>
          <div class="record-meta">
            <StatusBadge :value="order.status" kind="dispatch" />
            <span class="sub">{{ DispatchStatusText[order.status] }} · {{ formatDate(order.progress.length ? order.progress[order.progress.length - 1].at : order.requested_at) }}</span>
          </div>
        </div>
        <EmptyState v-if="!(shelterOrders.get(shelter.id)?.orders.length)" />
      </div>
    </div>
  </section>
</template>

<style scoped>
.shelters-page { display: grid; gap: 14px; }
.shelter-card { display: grid; grid-template-columns: 300px 1fr; gap: 20px; }
.shelter-head { display: flex; justify-content: space-between; gap: 10px; align-items: flex-start; }
.record-row { display: flex; justify-content: space-between; gap: 10px; padding: 10px 0; border-top: 1px solid #e4e0d3; }
.record-meta { text-align: right; display: grid; gap: 4px; justify-items: end; }
.line-chip { display: inline-block; background: #ecefe4; color: #2c4a33; border-radius: 6px; padding: 2px 8px; margin: 0 6px 0; font-size: 12px; }
@media (max-width: 860px) { .shelter-card { grid-template-columns: 1fr; } }
</style>
