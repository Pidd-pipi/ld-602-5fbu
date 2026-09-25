<script setup lang="ts">
import { computed } from "vue";
import { DispatchStatusText } from "../../constants/DispatchStatus";
import { BatchQualityStatusText } from "../../constants/DispatchRule";
import { formatStatus } from "../../utils/formatters";

const props = withDefaults(
  defineProps<{
    value: string;
    kind?: "dispatch" | "quality" | "warehouse" | "priority" | "raw";
  }>(),
  { kind: "raw" }
);

const toneClass = computed(() => {
  const value = props.value;
  if (props.kind === "dispatch") {
    return {
      SUBMITTED: "tone-warn",
      APPROVED: "tone-info",
      DISPATCHED: "tone-primary",
      RECEIVED: "tone-ok",
      REJECTED: "tone-danger",
      DRAFT: "tone-muted"
    }[value] ?? "tone-muted";
  }
  if (props.kind === "quality") {
    return {
      QUALIFIED: "tone-ok",
      NEAR_EXPIRE: "tone-warn",
      EXPIRED: "tone-danger",
      DAMAGED: "tone-danger"
    }[value] ?? "tone-muted";
  }
  if (props.kind === "warehouse") {
    return props.value === "ACTIVE" ? "tone-ok" : "tone-danger";
  }
  if (props.kind === "priority") {
    return { URGENT: "tone-danger", HIGH: "tone-warn", NORMAL: "tone-info" }[props.value] ?? "tone-muted";
  }
  return "tone-muted";
});

const label = computed(() => {
  if (props.kind === "dispatch") return DispatchStatusText[props.value as keyof typeof DispatchStatusText] ?? props.value;
  if (props.kind === "quality") return BatchQualityStatusText[props.value as keyof typeof BatchQualityStatusText] ?? props.value;
  if (props.kind === "warehouse") return props.value === "ACTIVE" ? "启用中" : "已停用";
  if (props.kind === "priority") return ({ URGENT: "紧急", HIGH: "高", NORMAL: "常规" } as Record<string, string>)[props.value] ?? props.value;
  return formatStatus(props.value);
});
</script>

<template>
  <span class="badge" :class="toneClass">{{ label }}</span>
</template>
