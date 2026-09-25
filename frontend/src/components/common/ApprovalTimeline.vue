<script setup lang="ts">
import { computed } from "vue";
import type { ApprovalTimelineEntry } from "../../types/ApprovalTimeline";
import { TimelineActionText } from "../../constants/logTemplates";
import { formatDateTime } from "../../utils/formatters";

const props = withDefaults(
  defineProps<{ entries: ApprovalTimelineEntry[]; currentStatus?: string }>(),
  { currentStatus: "" }
);

const ordered = computed(() =>
  [...props.entries].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )
);

const iconOf: Record<string, string> = {
  SUBMIT: "📝",
  CHECK: "⚠️",
  APPROVE: "✅",
  REJECT: "❌",
  DISPATCH: "🚚",
  RECEIVE: "👍"
};

const toneOf: Record<string, string> = {
  SUBMIT: "tone-submit",
  CHECK: "tone-check",
  APPROVE: "tone-approve",
  REJECT: "tone-reject",
  DISPATCH: "tone-dispatch",
  RECEIVE: "tone-receive"
};
</script>

<template>
  <ol class="approval-timeline">
    <li
      v-for="(entry, index) in ordered"
      :key="entry.id"
      :class="['timeline-item', toneOf[entry.action] ?? '', { last: index === ordered.length - 1 }]"
    >
      <div class="timeline-dot">{{ iconOf[entry.action] ?? "•" }}</div>
      <div class="timeline-body">
        <div class="timeline-head">
          <strong>{{ TimelineActionText[entry.action] ?? entry.action }}</strong>
          <time>{{ formatDateTime(entry.created_at) }}</time>
        </div>
        <p>{{ entry.note }}</p>
        <small class="timeline-actor">操作人：{{ entry.actor }}</small>
      </div>
    </li>
  </ol>
</template>
