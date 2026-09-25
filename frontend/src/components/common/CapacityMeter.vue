<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    current: number;
    capacity: number;
    label?: string;
  }>(),
  { label: "入住率" }
);

const percent = computed(() => {
  if (!props.capacity) return 0;
  return Math.min(100, Math.round((props.current / props.capacity) * 100));
});
const level = computed(() => {
  if (percent.value >= 95) return "danger";
  if (percent.value >= 75) return "warn";
  return "ok";
});
</script>

<template>
  <div class="capacity-meter">
    <div class="meter-head">
      <span>{{ label }}</span>
      <strong :class="`text-${level}`">{{ current }}/{{ capacity }}（{{ percent }}%）</strong>
    </div>
    <div class="meter-track">
      <div class="meter-fill" :class="`fill-${level}`" :style="{ width: `${percent}%` }" />
    </div>
  </div>
</template>
