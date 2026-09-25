<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useShelterStore } from "../stores/ShelterStore";
import { useDispatchOrderStore } from "../stores/DispatchOrderStore";
import { useWarehouseStore } from "../stores/WarehouseStore";
import { useSupplyItemStore } from "../stores/SupplyItemStore";
import { useSessionStore } from "../stores/SessionStore";
import StatusBadge from "../components/common/StatusBadge.vue";
import CapacityMeter from "../components/common/CapacityMeter.vue";
import EmptyState from "../components/common/EmptyState.vue";
import RequestFormDialog from "../components/dispatch/RequestFormDialog.vue";
import type { DispatchRequestForm } from "../constructors/DispatchOrderConstructor";
import type { Shelter } from "../types/Shelter";
import { formatDateTime } from "../utils/formatters";

const shelterStore = useShelterStore();
const dispatchStore = useDispatchOrderStore();
const warehouseStore = useWarehouseStore();
const supplyStore = useSupplyItemStore();
const session = useSessionStore();
const router = useRouter();

const selectedShelterId = ref<number>(1);
const requestVisible = ref(false);

const selectedShelter = computed(() => shelterStore.byId(selectedShelterId.value));

const ordersOfShelter = computed(() =>
  dispatchStore.rows
    .filter((o) => o.shelter_id === selectedShelterId.value)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
);

const itemNameOf = (id: number) => supplyStore.byId(id)?.name ?? `物资#${id}`;
const unitOf = (id: number) => supplyStore.byId(id)?.unit ?? "";
const warehouseNameOf = (id: number) => warehouseStore.byId(id)?.name ?? `仓库#${id}`;

const selectShelter = (shelter: Shelter) => {
  selectedShelterId.value = shelter.id;
};

const openRequest = () => {
  requestVisible.value = true;
};

const submitRequest = async (form: DispatchRequestForm) => {
  await dispatchStore.submitRequest({ ...form, shelter_id: selectedShelterId.value });
  router.push("/dispatch");
};

onMounted(async () => {
  await Promise.all([shelterStore.load(), dispatchStore.load(), warehouseStore.load(), supplyStore.load()]);
  selectedShelterId.value = shelterStore.rows[0]?.id ?? 1;
});
</script>

<template>
  <section class="page-shelters">
    <header class="content-head">
      <div>
        <p class="eyebrow">Shelters</p>
        <h2>避难点管理</h2>
      </div>
    </header>

    <div class="shelter-grid">
      <button
        v-for="shelter in shelterStore.rows"
        :key="shelter.id"
        class="shelter-card panel"
        :class="{ active: shelter.id === selectedShelterId }"
        @click="selectShelter(shelter)"
      >
        <div class="shelter-card-head">
          <strong>{{ shelter.name }}</strong>
          <StatusBadge :value="shelter.open_status" kind="shelter" size="sm" />
        </div>
        <small class="muted">{{ shelter.district }} · 风险 {{ shelter.risk_level }} · 联系人 {{ shelter.contact_person }}</small>
        <CapacityMeter class="mt" :current="shelter.current_population" :capacity="shelter.capacity" />
      </button>
    </div>

    <div v-if="selectedShelter" class="panel shelter-detail">
      <div class="detail-title-row">
        <div>
          <h3>{{ selectedShelter.name }} · 需求申报与接收记录</h3>
          <p class="muted">
            联系人 {{ selectedShelter.contact_person }}（{{ selectedShelter.contact_phone }}） ·
            在点 {{ selectedShelter.current_population }} / 容量 {{ selectedShelter.capacity }}
          </p>
        </div>
        <button v-if="session.can('create')" class="btn btn-primary" @click="openRequest">+ 提交物资申请</button>
      </div>

      <h4 class="section-label">该避难点的调拨记录</h4>
      <table class="simple-table">
        <thead>
          <tr><th>单号</th><th>来源仓库</th><th>物资</th><th>状态</th><th>申请/关键时间</th></tr>
        </thead>
        <tbody>
          <tr v-for="order in ordersOfShelter" :key="order.id">
            <td>
              <RouterLink class="link-btn" to="/dispatch">{{ order.order_no }}</RouterLink>
            </td>
            <td>{{ warehouseNameOf(order.source_warehouse_id) }}</td>
            <td>
              <span v-for="line in order.lines" :key="line.id" class="line-chip">
                {{ itemNameOf(line.supply_item_id) }} ×{{ line.quantity }}{{ unitOf(line.supply_item_id) }}
              </span>
            </td>
            <td><StatusBadge :value="order.status" kind="dispatch" size="sm" /></td>
            <td><small>{{ formatDateTime(order.received_at || order.dispatched_at || order.approved_at || order.created_at) }}</small></td>
          </tr>
        </tbody>
      </table>
      <EmptyState v-if="ordersOfShelter.length === 0" text="该避难点还没有调拨记录，可提交物资申请" />
    </div>

    <RequestFormDialog
      v-model:visible="requestVisible"
      :warehouses="warehouseStore.rows"
      :shelters="shelterStore.rows"
      :items="supplyStore.rows"
      @submit="submitRequest"
    />
  </section>
</template>
