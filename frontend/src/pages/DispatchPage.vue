<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useDispatchOrderStore } from "../stores/DispatchOrderStore";
import { DispatchStatus, DispatchStatusText, type DispatchStatus as StatusValue } from "../constants/DispatchStatus";
import { formatDate } from "../utils/formatters";
import StatusBadge from "../components/common/StatusBadge.vue";
import DispatchDetailPanel from "../components/dispatch/DispatchDetailPanel.vue";
import type { DispatchOrder } from "../types/DispatchOrder";

type Role = "DISPATCHER" | "KEEPER" | "SHELTER";

const store = useDispatchOrderStore();
onMounted(() => store.load());

const filters = ["ALL", "SUBMITTED", "APPROVED", "DISPATCHED", "RECEIVED", "REJECTED"] as const;
type Filter = (typeof filters)[number];
const activeFilter = ref<Filter>("ALL");
const keyword = ref("");
const selectedId = ref<number | null>(null);
const currentRole = ref<Role>("DISPATCHER");

const roleOptions: { value: Role; label: string }[] = [
  { value: "DISPATCHER", label: "调度员（审批）" },
  { value: "KEEPER", label: "仓库员（出库）" },
  { value: "SHELTER", label: "避难点（签收）" }
];

const rows = computed(() => store.rows);

const filteredRows = computed(() =>
  rows.value.filter((order) => {
    const matchStatus = activeFilter.value === "ALL" || order.status === activeFilter.value;
    const key = keyword.value.trim();
    const matchKeyword =
      !key ||
      order.order_no.includes(key) ||
      order.source_warehouse_name.includes(key) ||
      order.shelter_name.includes(key) ||
      order.event_name.includes(key);
    return matchStatus && matchKeyword;
  })
);

const counts = computed(() => {
  const result: Record<string, number> = { ALL: rows.value.length };
  for (const status of DispatchStatus) result[status] = rows.value.filter((order) => order.status === status).length;
  return result;
});

const pendingCount = computed(() => rows.value.filter((order) => order.status === "SUBMITTED").length);

const selectedOrder = computed<DispatchOrder | null>(() =>
  selectedId.value === null ? null : rows.value.find((order) => order.id === selectedId.value) ?? null
);

/** 列表上直接展示最新一条进度，切换页面再回来仍能看到进度 */
function latestProgress(order: DispatchOrder) {
  return order.progress.length ? order.progress[order.progress.length - 1] : undefined;
}

function open(order: DispatchOrder) {
  selectedId.value = order.id;
}
function close() {
  selectedId.value = null;
}
function onChanged(payload: { success: boolean }) {
  if (payload.success) selectedId.value = null;
}
function resetDemo() {
  if (confirm("确定要重置为初始演示数据吗？当前审批进度将被清空。")) {
    store.resetDemo();
    selectedId.value = null;
  }
}
</script>

<template>
  <section class="dispatch-page">
    <div class="list-toolbar">
      <div class="role-switch">
        <span class="label">当前视角</span>
        <button
          v-for="option in roleOptions"
          :key="option.value"
          :class="{ active: currentRole === option.value }"
          @click="currentRole = option.value"
        >
          {{ option.label }}
        </button>
      </div>
      <input v-model="keyword" class="search" placeholder="搜索单号 / 仓库 / 避难点 / 事件" />
      <span class="source-tag" :class="store.source">{{ store.source === "online" ? "后端接口数据" : "本地数据（后端离线）" }}</span>
      <button class="btn ghost" @click="resetDemo">重置演示数据</button>
    </div>

    <div class="filter-tabs">
      <button
        v-for="filter in filters"
        :key="filter"
        :class="{ active: activeFilter === filter }"
        @click="activeFilter = filter"
      >
        {{ filter === "ALL" ? "全部" : DispatchStatusText[filter as StatusValue] }}
        <span class="count">{{ counts[filter] ?? 0 }}</span>
        <em v-if="filter === 'SUBMITTED' && pendingCount" class="dot-tip"></em>
      </button>
    </div>

    <div class="table-wrap">
      <table class="dispatch-table">
        <thead>
          <tr>
            <th>调拨单号</th>
            <th>来源仓库 / 接收避难点</th>
            <th>关联事件</th>
            <th>物资</th>
            <th>状态</th>
            <th>最新进度</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in filteredRows" :key="order.id" :class="{ pending: order.status === 'SUBMITTED' }">
            <td>
              <strong class="mono">{{ order.order_no }}</strong>
              <p class="sub">{{ formatDate(order.requested_at) }}</p>
            </td>
            <td>
              <strong>{{ order.source_warehouse_name }}</strong>
              <p class="sub">→ {{ order.shelter_name }}</p>
            </td>
            <td>{{ order.event_name }}</td>
            <td>
              <span v-for="line in order.lines" :key="line.id" class="line-chip">
                {{ line.supply_name }} ×{{ line.requested_quantity }}{{ line.unit }}
              </span>
            </td>
            <td><StatusBadge :value="order.status" kind="dispatch" /></td>
            <td>
              <template v-if="latestProgress(order)">
                <strong>{{ DispatchStatusText[latestProgress(order)!.status as StatusValue] }}</strong>
                <p class="sub">{{ latestProgress(order)?.actor }} · {{ formatDate(latestProgress(order)?.at ?? "") }}</p>
              </template>
              <span v-else class="sub">—</span>
            </td>
            <td>
              <button class="btn link" @click="open(order)">
                {{ order.status === "SUBMITTED" ? "审批处理" : "查看详情" }}
              </button>
            </td>
          </tr>
          <tr v-if="!filteredRows.length">
            <td colspan="7" class="empty-cell">没有符合条件的调拨单</td>
          </tr>
        </tbody>
      </table>
    </div>

    <DispatchDetailPanel
      :order="selectedOrder"
      :actor-role="currentRole"
      @close="close"
      @changed="onChanged"
    />
  </section>
</template>
