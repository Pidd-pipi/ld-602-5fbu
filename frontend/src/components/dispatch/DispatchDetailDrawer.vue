<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { DispatchOrder } from "../../types/DispatchOrder";
import type { ApprovalPlan } from "../../types/AllocationPlan";
import type { DispatchAction } from "../../constants/roles";
import StatusBadge from "../common/StatusBadge.vue";
import BatchTable, { type BatchTableRow } from "../common/BatchTable.vue";
import ApprovalTimeline from "../common/ApprovalTimeline.vue";
import EmptyState from "../common/EmptyState.vue";
import { DispatchPriorityText } from "../../constants/businessEnums";
import { formatDateTime, formatDate } from "../../utils/formatters";

const props = defineProps<{
  visible: boolean;
  order: DispatchOrder | null;
  plan: ApprovalPlan | null;
  warehouseNameOf: (id: number) => string;
  shelterNameOf: (id: number) => string;
  itemNameOf: (id: number) => string;
  unitOf: (id: number) => string;
  permissions: Record<DispatchAction, boolean>;
  acting?: boolean;
}>();

const emit = defineEmits<{
  (e: "update:visible", value: boolean): void;
  (e: "approve"): void;
  (e: "dispatch", vehicleNote: string): void;
  (e: "receive", note: string): void;
  (e: "reject", reason: string): void;
}>();

const vehicleNote = ref("");
const receiveNote = ref("");
const rejectNote = ref("");

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      vehicleNote.value = "";
      receiveNote.value = props.order?.receive_note ?? "";
      rejectNote.value = "";
    }
  }
);

const close = () => emit("update:visible", false);

const isSubmitted = computed(() => props.order?.status === "SUBMITTED");
const isApproved = computed(() => props.order?.status === "APPROVED");
const isDispatched = computed(() => props.order?.status === "DISPATCHED");
const isTerminal = computed(
  () => props.order?.status === "RECEIVED" || props.order?.status === "REJECTED"
);

/** 已冻结（APPROVED 之后）读行上的快照；待审批读实时 plan */
const rowsForLine = (lineId: number): BatchTableRow[] => {
  const order = props.order;
  if (!order) return [];
  const line = order.lines.find((l) => l.id === lineId);
  if (!line) return [];

  if (line.allocations.length > 0) {
    return line.allocations.map((alloc, index) => ({
      batch: {
        id: alloc.batch_id,
        warehouse_id: order.source_warehouse_id,
        supply_item_id: line.supply_item_id,
        batch_no: alloc.batch_no,
        quantity: alloc.remaining_before,
        remaining_quantity: alloc.remaining_before,
        expire_at: alloc.expire_at,
        inbound_source: "",
        quality_status: alloc.quality_status
      },
      itemName: props.itemNameOf(line.supply_item_id),
      unit: props.unitOf(line.supply_item_id),
      fefoOrder: index + 1,
      allocateQuantity: alloc.allocate_quantity
    }));
  }

  // 待审批：展示实时计划里的批次
  const linePlan = props.plan?.line_plans.find((p) => p.supply_item_id === line.supply_item_id);
  return (linePlan?.allocations ?? []).map((alloc, index) => ({
    batch: {
      id: alloc.batch_id,
      warehouse_id: order.source_warehouse_id,
      supply_item_id: line.supply_item_id,
      batch_no: alloc.batch_no,
      quantity: alloc.remaining_before,
      remaining_quantity: alloc.remaining_before,
      expire_at: alloc.expire_at,
      inbound_source: "",
      quality_status: alloc.quality_status
    },
    itemName: props.itemNameOf(line.supply_item_id),
    unit: props.unitOf(line.supply_item_id),
    fefoOrder: index + 1,
    allocateQuantity: alloc.allocate_quantity
  }));
};

const planLineOf = (supplyItemId: number) =>
  props.plan?.line_plans.find((p) => p.supply_item_id === supplyItemId);
</script>

<template>
  <div v-if="visible && order" class="drawer-mask" @click.self="close">
    <aside class="drawer">
      <header class="drawer-head">
        <div>
          <p class="eyebrow">调拨单详情</p>
          <h3>{{ order.order_no }}</h3>
          <div class="head-tags">
            <StatusBadge :value="order.status" kind="dispatch" />
            <StatusBadge :value="order.priority" kind="priority" size="sm" />
          </div>
        </div>
        <button class="icon-btn" @click="close">✕</button>
      </header>

      <div class="drawer-body">
        <!-- 基本信息 -->
        <section class="detail-card">
          <h4>来源与去向</h4>
          <dl class="info-grid">
            <div><dt>来源仓库</dt><dd>{{ warehouseNameOf(order.source_warehouse_id) }}</dd></div>
            <div><dt>接收避难点</dt><dd>{{ shelterNameOf(order.shelter_id) }}</dd></div>
            <div><dt>关联事件</dt><dd>{{ order.event_name || "—" }}</dd></div>
            <div><dt>申请人</dt><dd>{{ order.requested_by }}</dd></div>
            <div><dt>审批人</dt><dd>{{ order.approved_by || "—" }}</dd></div>
            <div><dt>签收人</dt><dd>{{ order.received_by || "—" }}</dd></div>
            <div><dt>申请时间</dt><dd>{{ formatDateTime(order.created_at) }}</dd></div>
            <div><dt>出库时间</dt><dd>{{ formatDateTime(order.dispatched_at) }}</dd></div>
          </dl>
        </section>

        <!-- 拦截原因：停用 / 缺口 -->
        <section v-if="order.blocking_reasons.length" class="detail-card">
          <h4>🚫 待审拦截原因（库存不足 / 仓库停用）</h4>
          <ul class="reason-list block">
            <li v-for="(reason, i) in order.blocking_reasons" :key="i">{{ reason }}</li>
          </ul>
        </section>

        <!-- 低于安全库存说明 -->
        <section v-if="order.warning_reasons.length" class="detail-card">
          <h4>⚠️ 低于安全库存说明</h4>
          <ul class="reason-list warn">
            <li v-for="(reason, i) in order.warning_reasons" :key="i">{{ reason }}</li>
          </ul>
          <p v-if="order.force_reason" class="force-record">强制出库原因：{{ order.force_reason }}</p>
        </section>

        <section v-if="order.status === 'REJECTED'" class="detail-card">
          <h4>❌ 驳回原因</h4>
          <p class="reject-record">{{ order.reject_reason }}</p>
        </section>

        <!-- 物资行与批次 FEFO -->
        <section class="detail-card">
          <h4>物资与批次（{{ isSubmitted ? "实时库存计算" : "批准时冻结" }}）</h4>
          <div v-for="line in order.lines" :key="line.id" class="line-block">
            <div class="line-summary">
              <strong>{{ itemNameOf(line.supply_item_id) }}</strong>
              <span>申请 {{ line.quantity }}{{ unitOf(line.supply_item_id) }}</span>
              <span :class="line.gap_quantity > 0 ? 'text-danger strong' : 'muted'">
                缺口 {{ planLineOf(line.supply_item_id)?.gap_quantity ?? line.gap_quantity }}{{ unitOf(line.supply_item_id) }}
              </span>
              <span :class="(planLineOf(line.supply_item_id)?.below_safety_after ?? line.below_safety_after) ? 'text-danger' : 'muted'">
                出库后剩 {{ planLineOf(line.supply_item_id)?.post_remaining ?? line.post_remaining }} / 安全 {{ line.safety_stock }}
              </span>
            </div>
            <BatchTable
              :rows="rowsForLine(line.id)"
              show-allocate
              compact
              :empty-text="isSubmitted ? '该物资当前无可用批次（可能全部过期/隔离）' : '无批次记录'"
            />
          </div>
          <EmptyState v-if="order.lines.length === 0" text="该调拨单没有物资明细" />
        </section>

        <!-- 待审批操作 -->
        <section v-if="isSubmitted" class="detail-card actions-card">
          <h4>审批操作</h4>
          <div v-if="!permissions.approve && !permissions.reject" class="muted">当前角色为只读，无审批权限。</div>
          <template v-else>
            <div class="action-row" v-if="permissions.approve">
              <button class="btn btn-primary" :disabled="acting" @click="emit('approve')">打开审批（查看批次计划）</button>
            </div>
            <div v-if="permissions.reject" class="action-row">
              <textarea v-model="rejectNote" rows="2" placeholder="驳回原因（驳回时必填）"></textarea>
              <button class="btn btn-danger" :disabled="!rejectNote.trim() || acting" @click="emit('reject', rejectNote)">驳回并退回避难点</button>
            </div>
          </template>
        </section>

        <!-- 出库操作 -->
        <section v-if="isApproved && permissions.dispatch" class="detail-card actions-card">
          <h4>仓库出库（按冻结的 FEFO 批次扣减库存）</h4>
          <textarea v-model="vehicleNote" rows="2" placeholder="车辆/司机/送达说明（可选）"></textarea>
          <button class="btn btn-primary" :disabled="acting" @click="emit('dispatch', vehicleNote)">确认出库并扣减批次库存</button>
        </section>

        <!-- 签收操作 -->
        <section v-if="isDispatched && permissions.receive" class="detail-card actions-card">
          <h4>避难点签收</h4>
          <textarea v-model="receiveNote" rows="2" placeholder="签收备注（数量、批次是否相符）"></textarea>
          <button class="btn btn-primary" :disabled="acting" @click="emit('receive', receiveNote)">确认签收</button>
        </section>

        <section v-if="isDispatched && !permissions.receive" class="detail-card">
          <p class="muted">物资在途，等待避难点签收。</p>
        </section>

        <!-- 时间线 -->
        <section class="detail-card">
          <h4>流转记录（申请 → 审批 → 出库 → 签收）</h4>
          <ApprovalTimeline :entries="order.timeline" :current-status="order.status" />
        </section>
      </div>
    </aside>
  </div>
</template>
