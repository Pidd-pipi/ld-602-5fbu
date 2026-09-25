<script setup lang="ts">
withDefaults(defineProps<{ text?: string; hint?: string }>(), { text: "暂无数据", hint: "" });
</script>

<template>
  <div class="empty-state">
    <div class="empty-icon">📦</div>
    <div class="empty-text">{{ text }}</div>
    <div v-if="hint" class="empty-hint">{{ hint }}</div>
  </div>
</template>
