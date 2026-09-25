<script setup lang="ts">
import { computed, toRef } from "vue";
import { useDispatchFlow } from "../../hooks/useDispatchFlow";
import { formatDate } from "../../utils/formatters";
import type { DispatchOrder } from "../../types/DispatchOrder";
import StatusBadge from "./StatusBadge.vue";

const props = defineProps<{ order: DispatchOrder; rejectedReason?: string }>();

const orderRef = toRef(props, "order");
const { steps, rejected } = useDispatchFlow(orderRef);
const rejectPoint = computed(() => props.order.progress.find((point) => point.status === "REJECTED"));
</script>

<template>
  <ol class="timeline">
    <li v-for="(step, index) in steps" :key="step.status" class="timeline-item" :class="{ done: step.reached, active: step.current }">
      <div class="dot">
        <svg v-if="step.reached" viewBox="0 0 16 16" width="12" height="12"><path d="M3 8.5l3 3 7-7" fill="none" stroke="currentColor" stroke-width="2" /></svg>
        <span v-else>{{ index + 1 }}</span>
      </div>
      <div class="content">
        <div class="step-head">
          <strong>{{ step.label }}</strong>
          <span v-if="step.current" class="current-tag">进行中</span>
          <span v-else-if="step.reached" class="at">{{ formatDate(step.at) }}</span>
          <span v-else class="at muted">待处理</span>
        </div>
        <p v-if="step.reached" class="meta">{{ step.actor }} · {{ step.remark }}</p>
        <p v-else class="meta muted">尚未到达该节点</p>
      </div>
    </li>
    <li v-if="rejected" class="timeline-item rejected">
      <div class="dot">!</div>
      <div class="content">
        <div class="step-head">
          <strong>已驳回</strong>
          <StatusBadge value="REJECTED" kind="dispatch" />
        </div>
        <p class="meta">{{ rejectPoint?.actor }} · {{ rejectPoint?.remark ?? rejectedReason ?? "—" }}</p>
      </div>
    </li>
  </ol>
</template>
