<script setup lang="ts">
withDefaults(defineProps<{ label: string; value: string | number; sub?: string; tone?: string }>(), {
  sub: "",
  tone: ""
});
</script>

<template>
  <div class="stat" :class="tone ? `stat-${tone}` : ''">
    <span>{{ label }}</span>
    <strong>{{ value }}</strong>
    <small v-if="sub">{{ sub }}</small>
  </div>
</template>
