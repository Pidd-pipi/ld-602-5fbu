<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{ current: number; capacity: number; label?: string }>(),
  { label: "入住率" }
);

const percent = computed(() => (props.capacity > 0 ? Math.round((props.current / props.capacity) * 100) : 0));
const tone = computed(() => (percent.value >= 100 ? "danger" : percent.value >= 80 ? "warn" : "ok"));
</script>

<template>
  <div class="capacity-meter">
    <div class="meter-head">
      <span class="sub">{{ label }}</span>
      <span class="meter-pill" :class="tone">{{ current }} / {{ capacity }} · {{ percent }}%</span>
    </div>
    <div class="meter-track">
      <div class="meter-fill" :class="tone" :style="{ width: `${Math.min(percent, 100)}%` }"></div>
    </div>
  </div>
</template>

<style scoped>
.capacity-meter { display: grid; gap: 6px; margin-top: 8px; }
.meter-head { display: flex; justify-content: space-between; align-items: center; }
.meter-pill { border-radius: 999px; padding: 2px 10px; font-size: 12px; font-weight: 800; }
.meter-pill.ok { background: #dff3e2; color: #1d6b35; }
.meter-pill.warn { background: #fbecd0; color: #8a5a08; }
.meter-pill.danger { background: #fadcd8; color: #9c2a1c; }
.meter-track { height: 8px; background: #e7e5dc; border-radius: 999px; overflow: hidden; }
.meter-fill { height: 100%; border-radius: 999px; }
.meter-fill.ok { background: #2e7d46; }
.meter-fill.warn { background: #d39b46; }
.meter-fill.danger { background: #9c2a1c; }
</style>
