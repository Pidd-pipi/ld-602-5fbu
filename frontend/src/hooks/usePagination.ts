import { computed, ref, type Ref } from "vue";

/**
 * 通用分页：列表页与详情弹窗共用。
 * 传入任意响应式/普通数组，返回切片后的当前页与翻页方法。
 */
export function usePagination<T>(source: Ref<T[]> | (() => T[]), pageSize = 8) {
  const page = ref(1);
  const getRows = typeof source === "function" ? computed(source) : source;

  const total = computed(() => getRows.value.length);
  const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)));
  const pageRows = computed(() =>
    getRows.value.slice((page.value - 1) * pageSize, page.value * pageSize)
  );

  const reset = () => {
    page.value = 1;
  };
  const prev = () => {
    if (page.value > 1) page.value -= 1;
  };
  const next = () => {
    if (page.value < totalPages.value) page.value += 1;
  };

  return { page, pageSize, pageRows, total, totalPages, reset, prev, next };
}
