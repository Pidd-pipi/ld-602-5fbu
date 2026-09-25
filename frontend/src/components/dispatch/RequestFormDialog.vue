<script setup lang="ts">
import { computed, reactive, watch } from "vue";
import type { Warehouse } from "../../types/Warehouse";
import type { Shelter } from "../../types/Shelter";
import type { SupplyItem } from "../../types/SupplyItem";
import type { DispatchRequestForm } from "../../constructors/DispatchOrderConstructor";
import { createDispatchRequestForm } from "../../constructors/DispatchOrderConstructor";
import { DispatchPriority, DispatchPriorityText } from "../../constants/businessEnums";
import EmptyState from "../common/EmptyState.vue";

const props = defineProps<{
  visible: boolean;
  warehouses: Warehouse[];
  shelters: Shelter[];
  items: SupplyItem[];
}>();

const emit = defineEmits<{
  (e: "update:visible", value: boolean): void;
  (e: "submit", form: DispatchRequestForm): void;
}>();

const form = reactive<DispatchRequestForm>(createDispatchRequestForm());

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      const reset = createDispatchRequestForm({
        source_warehouse_id: props.warehouses.find((w) => w.status === "ACTIVE")?.id ?? 1,
        shelter_id: props.shelters[0]?.id ?? 1
      });
      Object.assign(form, reset);
    }
  }
);

const activeWarehouses = computed(() => props.warehouses.filter((w) => w.status === "ACTIVE"));

const addLine = () => form.items.push({ supply_item_id: props.items[0]?.id ?? 0, quantity: 1 });
const removeLine = (index: number) => form.items.splice(index, 1);

const canSubmit = computed(
  () =>
    form.source_warehouse_id > 0 &&
    form.shelter_id > 0 &&
    form.requested_by.trim() &&
    form.items.some((row) => row.supply_item_id > 0 && row.quantity > 0)
);

const close = () => emit("update:visible", false);
const submit = () => {
  if (!canSubmit.value) return;
  emit("submit", { ...form, items: form.items.filter((r) => r.supply_item_id > 0 && r.quantity > 0) });
  close();
};
</script>

<template>
  <div v-if="visible" class="modal-mask" @click.self="close">
    <div class="modal dialog-request">
      <header class="modal-head">
        <h3>避难点物资申请</h3>
        <button class="icon-btn" @click="close">✕</button>
      </header>
      <div class="modal-body">
        <div class="form-grid">
          <label>
            <span>来源仓库</span>
            <select v-model.number="form.source_warehouse_id">
              <option v-for="w in activeWarehouses" :key="w.id" :value="w.id">
                {{ w.name }}（{{ w.district }}）
              </option>
            </select>
            <small v-if="activeWarehouses.length === 0" class="text-danger">暂无可选启用仓库</small>
          </label>
          <label>
            <span>申请避难点</span>
            <select v-model.number="form.shelter_id">
              <option v-for="s in shelters" :key="s.id" :value="s.id">
                {{ s.name }}（{{ s.district }}）
              </option>
            </select>
          </label>
          <label>
            <span>关联事件</span>
            <input v-model="form.event_name" placeholder="如：望江路段内涝；日常补充可留空" />
          </label>
          <label>
            <span>优先级</span>
            <select v-model="form.priority">
              <option v-for="p in DispatchPriority" :key="p" :value="p">{{ DispatchPriorityText[p] }}</option>
            </select>
          </label>
          <label class="span-2">
            <span>申报人</span>
            <input v-model="form.requested_by" placeholder="如：陈主任（望江社区）" />
          </label>
        </div>

        <div class="lines-head">
          <h4>申请物资明细</h4>
          <button class="btn btn-ghost btn-sm" @click="addLine">+ 添加物资</button>
        </div>
        <EmptyState v-if="form.items.length === 0" text="请添加至少一条物资明细" />
        <div v-for="(row, index) in form.items" :key="index" class="line-row">
          <select v-model.number="row.supply_item_id">
            <option v-for="item in items" :key="item.id" :value="item.id">
              {{ item.name }}（安全库存 {{ item.safety_stock }}{{ item.unit }}）
            </option>
          </select>
          <input v-model.number="row.quantity" type="number" min="1" class="qty-input" />
          <span class="unit-label">{{ items.find((i) => i.id === row.supply_item_id)?.unit }}</span>
          <button class="icon-btn danger" @click="removeLine(index)" :disabled="form.items.length === 1">✕</button>
        </div>
      </div>
      <footer class="modal-foot">
        <button class="btn btn-ghost" @click="close">取消</button>
        <button class="btn btn-primary" :disabled="!canSubmit" @click="submit">提交申请（进入待审批）</button>
      </footer>
    </div>
  </div>
</template>
