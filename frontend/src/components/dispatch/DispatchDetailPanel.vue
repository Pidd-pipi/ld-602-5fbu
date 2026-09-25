<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { DispatchOrder } from "../../types/DispatchOrder";
import { useDispatchOrderStore } from "../../stores/DispatchOrderStore";
import { formatDate, formatNumber } from "../../utils/formatters";
import StatusBadge from "../common/StatusBadge.vue";
import BatchTable, { type BatchTableRow } from "../common/BatchTable.vue";
import ApprovalTimeline from "../common/ApprovalTimeline.vue";

const props = defineProps<{ order: DispatchOrder | null; actorRole: "DISPATCHER" | "KEEPER" | "SHELTER" }>();
const emit = defineEmits<{ (event: "close"): void; (event: "changed", payload: { success: boolean }): void }>();

const store = useDispatchOrderStore();

const safetyReason = ref("");
const approveNote = ref("");
const rejectReason = ref("");
const receiveRemark = ref("");
const showRejectBox = ref(false);

watch(
  () => props.order?.id,
  () => {
    safetyReason.value = "";
    approveNote.value = "";
    rejectReason.value = "";
    receiveRemark.value = "";
    showRejectBox.value = false;
  }
);

const plan = computed(() => (props.order ? store.preview(props.order.id) : null));

const warehouseMap = computed(() => new Map((store.snapshot?.warehouse ?? []).map((entry) => [entry.id, entry])));
const sourceWarehouse = computed(() => (props.order ? warehouseMap.value.get(props.order.source_warehouse_id) : undefined));

const isPending = computed(() => props.order?.status === "SUBMITTED");

interface LineView {
  lineId: number;
  name: string;
  sku: string;
  unit: string;
  requested: number;
  available: number;
  shortage: number;
  rows: BatchTableRow[];
}

/** 待审批展示 FEFO 试算结果；已批准及之后展示锁定的批次分配方案 */
const lineViews = computed<LineView[]>(() => {
  if (!props.order) return [];
  if (isPending.value && plan.value) {
    return plan.value.lines.map((planLine) => ({
      lineId: planLine.line.id,
      name: planLine.item.name,
      sku: planLine.item.sku_code,
      unit: planLine.item.unit,
      requested: planLine.line.requested_quantity,
      available: planLine.allocations.reduce((sum, entry) => sum + entry.available_quantity, 0),
      shortage: planLine.gap?.shortage_quantity ?? 0,
      rows: planLine.allocations.map((allocation) => ({
        ...allocation,
        quality_status: allocation.near_expire ? "NEAR_EXPIRE" : "QUALIFIED",
        unit: planLine.item.unit
      }))
    }));
  }
  return props.order.lines.map((line) => ({
    lineId: line.id,
    name: line.supply_name,
    sku: line.sku_code,
    unit: line.unit,
    requested: line.requested_quantity,
    available: line.allocations.reduce((sum, entry) => sum + entry.available_quantity, 0),
    shortage: 0,
    rows: line.allocations.map((allocation) => ({
      ...allocation,
      quality_status: allocation.near_expire ? "NEAR_EXPIRE" : "QUALIFIED",
      unit: line.unit
    }))
  }));
});

async function doApprove() {
  if (!props.order) return;
  const approved = await store.approve(props.order.id, "调度员 王磊", safetyReason.value, approveNote.value);
  // 库存不足保持待审时不关闭抽屉，缺口仍在当前面板展示
  emit("changed", { success: approved });
}

async function doReject() {
  if (!props.order) return;
  if (await store.reject(props.order.id, "调度员 王磊", rejectReason.value)) emit("changed", { success: true });
}

async function doDispatch() {
  if (!props.order) return;
  const ok = await store.dispatch(props.order.id, "仓库员 赵刚");
  emit("changed", { success: ok });
}

async function doReceive() {
  if (!props.order) return;
  const ok = await store.receive(
    props.order.id,
    props.order.requested_by.split("（")[0] || "避难点联系人",
    receiveRemark.value
  );
  emit("changed", { success: ok });
}
</script>

<template>
  <div v-if="order" class="drawer" @click.self="emit('close')">
    <div class="drawer-panel">
      <header class="drawer-head">
        <div>
          <p class="eyebrow">调拨单详情</p>
          <h2>{{ order.order_no }}</h2>
          <div class="head-tags">
            <StatusBadge :value="order.status" kind="dispatch" />
            <StatusBadge :value="order.priority" kind="priority" />
          </div>
        </div>
        <button class="close-btn" @click="emit('close')">关闭 ✕</button>
      </header>

      <div v-if="store.error" class="alert alert-error">{{ store.error }}</div>

      <section class="info-grid">
        <div>
          <span class="label">来源仓库</span>
          <strong>{{ sourceWarehouse?.name ?? "未知仓库" }}</strong>
          <StatusBadge :value="sourceWarehouse?.status ?? 'DISABLED'" kind="warehouse" />
          <p class="sub">{{ sourceWarehouse?.district }} · {{ sourceWarehouse?.address }}</p>
        </div>
        <div>
          <span class="label">接收避难点</span>
          <strong>{{ order.shelter_name || `避难点 #${order.shelter_id}` }}</strong>
          <p class="sub">事件：{{ order.event_name }}</p>
        </div>
        <div>
          <span class="label">申请人 / 时间</span>
          <strong>{{ order.requested_by.split("（")[0] }}</strong>
          <p class="sub">{{ formatDate(order.requested_at) }}</p>
        </div>
      </section>

      <!-- 阻塞原因：仓库停用（ERROR）/ 跌破安全库存（WARNING） -->
      <section v-if="isPending && plan && plan.blockReasons.length" class="reasons">
        <div
          v-for="(reason, index) in plan.blockReasons"
          :key="index"
          class="alert"
          :class="reason.level === 'ERROR' ? 'alert-error' : 'alert-warn'"
        >
          <strong>{{ reason.level === "ERROR" ? "不可批准：" : "需说明原因：" }}</strong>{{ reason.message }}
        </div>
      </section>

      <!-- 库存不足：保持待审并列出缺口 -->
      <section v-if="isPending && plan && plan.gaps.length" class="gaps">
        <h3>库存缺口（单据保持待审批）</h3>
        <table>
          <thead><tr><th>物资</th><th>申请数量</th><th>有效库存</th><th>缺口</th></tr></thead>
          <tbody>
            <tr v-for="gap in plan.gaps" :key="gap.supply_item_id">
              <td>{{ gap.supply_name }}</td>
              <td>{{ formatNumber(gap.requested_quantity) }} {{ gap.unit }}</td>
              <td>{{ formatNumber(gap.available_quantity) }} {{ gap.unit }}</td>
              <td class="shortage">缺 {{ formatNumber(gap.shortage_quantity) }} {{ gap.unit }}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <!-- 物资与批次：剩余量、到期日、FEFO 顺序 -->
      <section class="lines">
        <h3>物资明细与批次方案 <span v-if="isPending" class="hint">按到期日从近到远自动分配（临期先出）</span></h3>
        <article v-for="line in lineViews" :key="line.lineId" class="line-card">
          <div class="line-head">
            <div>
              <strong>{{ line.name }}</strong>
              <span class="mono sub">{{ line.sku }}</span>
            </div>
            <div class="line-qty">
              申请 <strong>{{ formatNumber(line.requested) }}</strong> {{ line.unit }}
              <span v-if="isPending" class="sub">
                有效库存 {{ formatNumber(line.available) }} {{ line.unit }}
              </span>
              <span v-if="line.shortage > 0" class="shortage">缺口 {{ formatNumber(line.shortage) }} {{ line.unit }}</span>
            </div>
          </div>
          <BatchTable :rows="line.rows" :mode="isPending ? 'plan' : 'result'" />
        </article>
      </section>

      <!-- 审批操作区 -->
      <section v-if="order.status === 'SUBMITTED' && actorRole === 'DISPATCHER'" class="actions">
        <h3>审批操作</h3>
        <template v-if="plan && !plan.warehouseDisabled">
          <div v-if="plan.requireSafetyReason" class="form-row">
            <label>低于安全库存放行原因 <em>*</em></label>
            <textarea v-model="safetyReason" rows="2" placeholder="例如：经区应急办电话批准，险情优先，次日补库至安全线以上"></textarea>
          </div>
          <div class="form-row">
            <label>审批备注</label>
            <textarea v-model="approveNote" rows="2" placeholder="可选，随审批结果留存在时间线"></textarea>
          </div>
          <div class="btn-row">
            <button class="btn primary" :disabled="!plan.canApprove || (plan.requireSafetyReason && !safetyReason.trim())" @click="doApprove">
              批准并锁定批次方案
            </button>
            <button class="btn danger-ghost" @click="showRejectBox = !showRejectBox">驳回</button>
          </div>
          <p v-if="!plan.canApprove" class="hint danger">存在缺口或来源仓库已停用，批准按钮不可用，单据保持待审批。</p>
          <div v-if="showRejectBox" class="form-row reject-box">
            <textarea v-model="rejectReason" rows="2" placeholder="驳回原因（必填）"></textarea>
            <button class="btn danger" :disabled="!rejectReason.trim()" @click="doReject">确认驳回</button>
          </div>
        </template>
        <p v-else class="hint danger">来源仓库已停用，请改派其他仓库后重新提交。</p>
      </section>

      <section v-if="order.status === 'APPROVED' && actorRole === 'KEEPER'" class="actions">
        <h3>仓库出库</h3>
        <p class="hint">出库将按上方锁定方案实际扣减批次余量（临期批次先出）。</p>
        <button class="btn primary" @click="doDispatch">确认出库</button>
      </section>

      <section v-if="order.status === 'DISPATCHED' && actorRole === 'SHELTER'" class="actions">
        <h3>避难点签收</h3>
        <div class="form-row">
          <label>签收备注</label>
          <textarea v-model="receiveRemark" rows="2" placeholder="可选，例如：现场清点，数量与批次一致"></textarea>
        </div>
        <button class="btn primary" @click="doReceive">确认签收</button>
      </section>

      <p v-if="order.decision_note" class="decision-note"><span class="label">审批结论：</span>{{ order.decision_note }}</p>

      <section class="timeline-wrap">
        <h3>流程进度</h3>
        <ApprovalTimeline :order="order" />
      </section>
    </div>
  </div>
</template>
