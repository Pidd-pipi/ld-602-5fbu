<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useDispatchOrderStore } from "../stores/DispatchOrderStore";
import { useWarehouseStore } from "../stores/WarehouseStore";
import { useShelterStore } from "../stores/ShelterStore";
import { useSupplyItemStore } from "../stores/SupplyItemStore";
import { useInventoryBatchStore } from "../stores/InventoryBatchStore";
import { useSessionStore } from "../stores/SessionStore";
import { useDispatchFlow } from "../hooks/useDispatchFlow";
import { usePagination } from "../hooks/usePagination";
import { previewDispatchApproval } from "../api/DispatchOrder";
import type { DispatchOrder } from "../types/DispatchOrder";
import type { ApprovalPlan } from "../types/AllocationPlan";
import type { DispatchRequestForm } from "../constructors/DispatchOrderConstructor";
import {
  DispatchStatusFilterOptions
} from "../constants/DispatchStatus";
import { DispatchPriorityRank } from "../constants/businessEnums";
import StatusBadge from "../components/common/StatusBadge.vue";
import EmptyState from "../components/common/EmptyState.vue";
import RequestFormDialog from "../components/dispatch/RequestFormDialog.vue";
import ApprovalDialog from "../components/dispatch/ApprovalDialog.vue";
import DispatchDetailDrawer from "../components/dispatch/DispatchDetailDrawer.vue";
import { formatDateTime } from "../utils/formatters";

const dispatchStore = useDispatchOrderStore();
const warehouseStore = useWarehouseStore();
const shelterStore = useShelterStore();
const supplyItemStore = useSupplyItemStore();
const inventoryBatchStore = useInventoryBatchStore();
const session = useSessionStore();

const statusFilter = ref<string>("SUBMITTED");
const keyword = ref("");
const onlyGap = ref(false);
const requestVisible = ref(false);
const detailVisible = ref(false);
const approveVisible = ref(false);
const currentOrderId = ref<number | null>(null);
const toast = ref<{ kind: "ok" | "warn" | "err"; text: string } | null>(null);
let toastTimer: ReturnType<typeof setTimeout> | undefined;

const showToast = (kind: "ok" | "warn" | "err", text: string) => {
  toast.value = { kind, text };
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toast.value = null), 4200);
};

const flow = useDispatchFlow(dispatchStore, {
  onBlocked: (order, plan) => {
    showToast("err", `单据 ${order.order_no} 保持待审批：${plan.blocking_reasons[0] ?? "存在未满足条件"}`);
    approveVisible.value = false;
    detailVisible.value = true;
  },
  onApproved: (order) => {
    showToast("ok", `单据 ${order.order_no} 已批准，批次按临期优先顺序冻结`);
    approveVisible.value = false;
    detailVisible.value = true;
  }
});

const itemNameOf = (id: number) => supplyItemStore.byId(id)?.name ?? `物资#${id}`;
const unitOf = (id: number) => supplyItemStore.byId(id)?.unit ?? "";
const warehouseNameOf = (id: number) => warehouseStore.byId(id)?.name ?? `仓库#${id}`;
const shelterNameOf = (id: number) => shelterStore.byId(id)?.name ?? `避难点#${id}`;

const filteredRows = computed(() =>
  [...dispatchStore.rows]
    .filter((row) => (statusFilter.value ? row.status === statusFilter.value : true))
    .filter((row) => {
      if (!keyword.value.trim()) return true;
      const key = keyword.value.trim();
      return (
        row.order_no.includes(key) ||
        row.event_name.includes(key) ||
        warehouseNameOf(row.source_warehouse_id).includes(key) ||
        shelterNameOf(row.shelter_id).includes(key)
      );
    })
    .filter((row) => (onlyGap.value ? row.blocking_reasons.length > 0 : true))
    .sort((a, b) => {
      // 待审优先，再按优先级与申请时间
      if (a.status === "SUBMITTED" && b.status !== "SUBMITTED") return -1;
      if (b.status === "SUBMITTED" && a.status !== "SUBMITTED") return 1;
      const rank = DispatchPriorityRank[a.priority as keyof typeof DispatchPriorityRank] - DispatchPriorityRank[b.priority as keyof typeof DispatchPriorityRank];
      if (rank !== 0) return rank;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    })
);

const { pageRows, page, totalPages, prev, next, reset: resetPage } = usePagination(filteredRows, 8);

/** 待审批单据实时计算计划，数据变化（批次扣减/仓库停用）后通过版本号自动失效 */
const planCache = new Map<number, string>();
const dataVersion = computed(
  () =>
    `${inventoryBatchStore.rows.length}:${inventoryBatchStore.rows.reduce((s, b) => s + b.remaining_quantity, 0)}:${warehouseStore.rows.map((w) => `${w.id}-${w.status}`).join("|")}`
);
const safePlanOf = (order: DispatchOrder): ApprovalPlan | null => {
  try {
    const version = `${order.status}:${dataVersion.value}`;
    const cached = planCache.get(order.id);
    if (cached !== version || !planObjects.has(order.id)) {
      planObjects.set(order.id, previewDispatchApproval(order));
      planCache.set(order.id, version);
    }
    return planObjects.get(order.id)!;
  } catch {
    return null;
  }
};
const planObjects = new Map<number, ApprovalPlan>();
const currentOrder = computed(() =>
  currentOrderId.value !== null ? dispatchStore.byId(currentOrderId.value) : undefined
);
const currentPlan = computed(() => (currentOrder.value ? safePlanOf(currentOrder.value) : null));

/** 列表上的缺口/预警标记（不逐单请求后端，用挂在单据上的结果 + 待审实时计算） */
const pendingGapOf = (order: DispatchOrder): string => {
  if (order.blocking_reasons.length) return order.blocking_reasons[0];
  if (order.status !== "SUBMITTED") return "";
  const plan = safePlanOf(order);
  if (!plan) return "";
  return !plan.approvable ? plan.blocking_reasons[0] : "";
};

const onFilterChange = () => resetPage();

const openDetail = (order: DispatchOrder) => {
  currentOrderId.value = order.id;
  detailVisible.value = true;
};

const openApprove = () => {
  approveVisible.value = true;
};

const handleSubmitRequest = async (form: DispatchRequestForm) => {
  if (!session.can("create")) {
    showToast("err", "当前角色没有申报权限");
    return;
  }
  await dispatchStore.submitRequest(form);
  statusFilter.value = "SUBMITTED";
  resetPage();
  showToast("ok", "申请已提交，进入待审批列表");
};

const handleApproveConfirm = async (forceReason: string) => {
  if (!currentOrder.value) return;
  try {
    await flow.approve(currentOrder.value, forceReason);
  } catch (error) {
    showToast("err", error instanceof Error ? error.message : "审批失败");
  }
};

const handleReject = async (reason: string) => {
  if (!currentOrder.value) return;
  await flow.reject(currentOrder.value, reason);
  approveVisible.value = false;
  showToast("ok", "单据已驳回");
};

const handleDispatch = async (vehicleNote: string) => {
  if (!currentOrder.value) return;
  try {
    await flow.dispatch(currentOrder.value, vehicleNote);
    await inventoryBatchStore.load();
    showToast("ok", "已出库，批次剩余量已按 FEFO 扣减");
  } catch (error) {
    showToast("err", error instanceof Error ? error.message : "出库失败");
  }
};

const handleReceive = async (note: string) => {
  if (!currentOrder.value) return;
  await flow.receive(currentOrder.value, note);
  showToast("ok", "签收完成，结果已写入列表与详情");
};

const pendingCount = computed(() => dispatchStore.pendingRows.length);
const gapCount = computed(
  () => dispatchStore.rows.filter((row) => row.blocking_reasons.length > 0).length
);

onMounted(async () => {
  await Promise.all([
    dispatchStore.load(),
    warehouseStore.load(),
    shelterStore.load(),
    supplyItemStore.load(),
    inventoryBatchStore.load()
  ]);
});
</script>

<template>
  <section class="page-dispatch">
    <header class="content-head">
      <div>
        <p class="eyebrow">Dispatch Approval</p>
        <h2>调拨审批</h2>
        <p class="sub">点开单据查看来源仓库、批次剩余量与到期日；批准按临期优先出库，库存不足保持待审并列缺口。</p>
      </div>
      <button v-if="flow.visibleActions.value.canCreate" class="btn btn-primary" @click="requestVisible = true">
        + 避难点物资申请
      </button>    </header>

    <div v-if="toast" class="toast" :class="`toast-${toast.kind}`">{{ toast.text }}</div>

    <div class="filter-bar">
      <div class="filter-tabs">
        <button
          v-for="opt in DispatchStatusFilterOptions"
          :key="opt.value"
          :class="{ active: statusFilter === opt.value }"
          @click="statusFilter = opt.value; onFilterChange()"
        >
          {{ opt.label }}
        </button>
      </div>
      <div class="filter-extra">
        <label class="check-filter">
          <input type="checkbox" v-model="onlyGap" @change="resetPage" />
          只看有缺口/停用拦截
          <span v-if="gapCount" class="gap-chip">{{ gapCount }}</span>
        </label>
        <input v-model="keyword" class="search-input" placeholder="搜单号 / 事件 / 仓库 / 避难点" />
      </div>
    </div>

    <div class="table-card">
      <table class="dispatch-table">
        <thead>
          <tr>
            <th>调拨单号</th>
            <th>事件</th>
            <th>来源仓库 → 避难点</th>
            <th>申请物资</th>
            <th>优先级</th>
            <th>状态 / 进度</th>
            <th>库存检查</th>
            <th>更新时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in pageRows" :key="order.id" :class="{ 'row-gap': order.blocking_reasons.length }">
            <td><button class="link-btn" @click="openDetail(order)">{{ order.order_no }}</button></td>
            <td>{{ order.event_name }}</td>
            <td>
              <div>{{ warehouseNameOf(order.source_warehouse_id) }}</div>
              <small class="muted">→ {{ shelterNameOf(order.shelter_id) }}</small>
            </td>
            <td>
              <span v-for="line in order.lines" :key="line.id" class="line-chip">
                {{ itemNameOf(line.supply_item_id) }} ×{{ line.quantity }}{{ unitOf(line.supply_item_id) }}
              </span>
            </td>
            <td><StatusBadge :value="order.priority" kind="priority" size="sm" /></td>
            <td>
              <StatusBadge :value="order.status" kind="dispatch" size="sm" />
              <small class="muted step-line">
                <template v-if="order.status === 'RECEIVED'">已签收</template>
                <template v-else-if="order.status === 'REJECTED'">已驳回</template>
                <template v-else-if="order.status === 'DISPATCHED'">已出库 · 待签收</template>
                <template v-else-if="order.status === 'APPROVED'">已批准 · 待出库</template>
                <template v-else>待审批 · 待审 {{ pendingCount }} 单</template>
              </small>
            </td>
            <td>
              <span v-if="order.blocking_reasons.length" class="check-tag check-block" :title="order.blocking_reasons.join('；')">
                缺口/停用
              </span>
              <span v-else-if="order.warning_reasons.length" class="check-tag check-warn" :title="order.warning_reasons.join('；')">
                低于安全库存
              </span>
              <span v-else-if="pendingGapOf(order)" class="check-tag check-block" :title="pendingGapOf(order)">库存不足</span>
              <span v-else class="check-tag check-ok">可批准</span>
            </td>
            <td><small>{{ formatDateTime(
              order.received_at || order.dispatched_at || order.approved_at || order.created_at
            ) }}</small></td>
            <td>
              <button class="btn btn-sm" :class="order.status === 'SUBMITTED' ? 'btn-primary' : 'btn-ghost'" @click="openDetail(order)">
                {{ order.status === "SUBMITTED" ? "审批" : "查看" }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <EmptyState v-if="pageRows.length === 0" text="没有符合条件的调拨单" hint="可切换状态筛选或提交新的物资申请" />

      <div v-if="totalPages > 1" class="pagination">
        <button class="btn btn-ghost btn-sm" :disabled="page === 1" @click="prev">上一页</button>
        <span>第 {{ page }} / {{ totalPages }} 页</span>
        <button class="btn btn-ghost btn-sm" :disabled="page === totalPages" @click="next">下一页</button>
      </div>
    </div>

    <RequestFormDialog
      v-model:visible="requestVisible"
      :warehouses="warehouseStore.rows"
      :shelters="shelterStore.rows"
      :items="supplyItemStore.rows"
      @submit="handleSubmitRequest"
    />

    <DispatchDetailDrawer
      v-model:visible="detailVisible"
      :order="currentOrder ?? null"
      :plan="currentPlan"
      :warehouse-name-of="warehouseNameOf"
      :shelter-name-of="shelterNameOf"
      :item-name-of="itemNameOf"
      :unit-of="unitOf"
      :permissions="{
        create: session.can('create'),
        approve: session.can('approve'),
        reject: session.can('reject'),
        dispatch: session.can('dispatch'),
        receive: session.can('receive'),
        toggleWarehouse: session.can('toggleWarehouse')
      }"
      :acting="flow.acting.value"
      @approve="openApprove"
      @dispatch="handleDispatch"
      @receive="handleReceive"
      @reject="handleReject"
    />

    <ApprovalDialog
      v-if="currentOrder"
      v-model:visible="approveVisible"
      :order="currentOrder"
      :plan="currentPlan"
      :item-name-of="itemNameOf"
      :unit-of="unitOf"
      @confirm="handleApproveConfirm"
      @reject="handleReject"
    />
  </section>
</template>
