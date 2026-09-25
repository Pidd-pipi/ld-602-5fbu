<script setup lang="ts">
import { computed } from "vue";
import { DispatchStatusText } from "../../constants/DispatchStatus";
import { ShelterStatusText } from "../../constants/ShelterStatus";
import {
  QualityStatusText,
  WarehouseStatusText,
  DispatchPriorityText,
  ShelterRiskLevelText
} from "../../constants/businessEnums";

const props = withDefaults(
  defineProps<{
    value: string;
    kind?: "dispatch" | "shelter" | "quality" | "warehouse" | "priority" | "risk" | "raw";
    size?: "sm" | "md";
  }>(),
  { kind: "raw", size: "md" }
);

const maps: Record<string, Record<string, string>> = {
  dispatch: DispatchStatusText,
  shelter: ShelterStatusText,
  quality: QualityStatusText,
  warehouse: WarehouseStatusText,
  priority: DispatchPriorityText,
  risk: ShelterRiskLevelText
};

const label = computed(() => maps[props.kind]?.[props.value] ?? props.value.replace(/_/g, " "));
const toneClass = computed(() => `tone-${props.kind === "raw" ? "raw" : props.value.toLowerCase()}`);
</script>

<template>
  <span class="badge" :class="[toneClass, { sm: size === 'sm' }]">{{ label }}</span>
</template>
