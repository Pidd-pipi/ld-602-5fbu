<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { DispatchOrder } from "../../types/DispatchOrder";
import type { ApprovalPlan } from "../../types/AllocationPlan";
import BatchTable, { type BatchTableRow } from "../common/BatchTable.vue";
import { useSessionStore } from "../../stores/SessionStore";

const props = defineProps<{
  visible: boolean;
  order: DispatchOrder | null;
  plan: ApprovalPlan | null;
  itemNameOf: (id: number) => string;
  unitOf: (id: number) => string;
}>();

const emit = defineEmits<{
  (e: "update:visible", value: boolean): void;
  (e: "confirm", forceReason: string): void;
  (e: "reject", reason: string): void;
}>();

const session = useSessionStore();
const forceReason = ref("");
const rejectReason = ref("");

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      forceReason.value = props.order?.force_reason ?? "";
      rejectReason.value = "";
    }
  }
);

const close = () => emit("update:visible", false);

/** 把每个物资行的 FEFO 计划展开为批次表格行：临期批在前、后续批接续，过期批标红排除 */
const batchRowsFor = (lineId: number): BatchTableRow[] => {
  const plan = props.plan;
  const order = props.order;
  if (!plan || !order) return [];
  const line = order.lines.find((l) => l.id === lineId);
  const linePlan = plan.line_plans.find((p) => p.supply_item_id === line?.supply_item_id);
  if (!line || !linePlan) return [];

  const allocated = linePlan.allocations.map((alloc, index) => {
    const batch = {
      id: alloc.batch_id,
      warehouse_id: plan.warehouse_id,
      supply_item_id: line.supply_item_id,
      batch_no: alloc.batch_no,
      quantity: alloc.remaining_before,
      remaining_quantity: alloc.remaining_before,
      expire_at: alloc.expire_at,
      inbound_source: "",
      quality_status: alloc.quality_status
    };
    return {
      batch,
      itemName: props.itemNameOf(line.supply_item_id),
      unit: props.unitOf(line.supply_item_id),
      fefoOrder: index + 1,
      allocateQuantity: alloc.allocate_quantity
    };
  });
  return allocated;
};

const canForceApprove = computed(() =>
  (props.plan?.warning_reasons.length ?? 0) > 0 ? forceReason.value.trim().length >= 5 : true
);
</script>

<template>
  <div v-if="visible && order && plan" class="modal-mask" @click.self="close">
    <div class="modal dialog-approve">
      <header class="modal-head">
        <h3>审批操作 · {{ order.order_no }}</h3>
        <button class="icon-btn" @click="close">✕</button>
      </header>
      <div class="modal-body">
        <!-- 硬拦截：仓库停用 / 库存缺口，只能保持待审 -->
        <section v-if="!plan.approvable" class="alert alert-block">
          <h4>🚫 无法批准，单据保持「待审批」</h4>
          <ul>
            <li v-for="(reason, i) in plan.blocking_reasons" :key="i">{{ reason }}</li>
          </ul>
          <p class="alert-foot">
            请协调补货、轮换过期批次或改用其他来源仓库后，再由审批员重新审批；列表中已标记缺口。
          </p>
        </section>

        <!-- 软预警：出库后低于安全库存，必须填写原因 -->
        <section v-if="plan.approvable && plan.has_warning" class="alert alert-warn">
          <h4>⚠️ 强制出库预警（出库后低于安全库存）</h4>
          <ul>
            <li v-for="(reason, i) in plan.warning_reasons" :key="i">{{ reason }}</li>
          </ul>
          <label class="force-reason">
            <span>强制出库原因（必填，不少于 5 个字，将写入审批记录）</span>
            <textarea v-model="forceReason" rows="3" placeholder="如：防汛二级响应急需，经区应急局同意先发，48 小时内补库"></textarea>
          </label>
        </section>

        <section v-if="plan.approvable" class="plan-section">
          <h4>批次出库计划（临期批次优先，按到期日先后）</h4>
          <div v-for="line in order.lines" :key="line.id" class="plan-line">
            <div class="plan-line-head">
              <strong>{{ itemNameOf(line.supply_item_id) }}</strong>
              <span>申请 {{ line.quantity }}{{ unitOf(line.supply_item_id) }}</span>
              <span class="muted">可用 {{ plan.line_plans.find(p => p.supply_item_id === line.supply_item_id)?.available_quantity }}{{ unitOf(line.supply_item_id) }}</span>
              <span :class="plan.line_plans.find(p => p.supply_item_id === line.supply_item_id)?.below_safety_after ? 'text-danger' : 'muted'">
                出库后剩 {{ plan.line_plans.find(p => p.supply_item_id === line.supply_item_id)?.post_remaining }} / 安全库存 {{ line.safety_stock }}
              </span>
            </div>
            <BatchTable :rows="batchRowsFor(line.id)" show-allocate compact empty-text="该物资没有可分配批次" />
          </div>
        </section>

        <section class="reject-box">
          <h4>驳回（可选）</h4>
          <textarea v-model="rejectReason" rows="2" placeholder="如驳回请填写原因，留空则不驳回"></textarea>
        </section>
      </div>
      <footer class="modal-foot">
        <button class="btn btn-ghost" @click="close">关闭</button>
        <button
          v-if="plan.approvable && rejectReason.trim()"
          class="btn btn-danger"
          @click="emit('reject', rejectReason); close()"
        >
          确认驳回
        </button>
        <button
          v-if="plan.approvable"
          class="btn btn-primary"
          :disabled="!canForceApprove"
          @click="emit('confirm', forceReason); close()"
        >
          {{ plan.has_warning ? "确认批准并记录原因" : "确认批准（冻结批次）" }}
        </button>
        <button v-else class="btn btn-primary" disabled>库存/仓库不满足，保持待审</button>
        <small class="foot-actor">当前操作人：{{ session.actorName }}</small>
      </footer>
    </div>
  </div>
</template>
