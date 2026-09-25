<script setup lang="ts">
import { computed, ref } from "vue";
import { routes } from "./router/routes";
import StatusBadge from "./components/common/StatusBadge.vue";
import DashboardPage from "./pages/DashboardPage.vue";
import WarehousesPage from "./pages/WarehousesPage.vue";
import SheltersPage from "./pages/SheltersPage.vue";
import DispatchPage from "./pages/DispatchPage.vue";
import EventsPage from "./pages/EventsPage.vue";

const pageComponents = {
  "/dashboard": DashboardPage,
  "/warehouses": WarehousesPage,
  "/shelters": SheltersPage,
  "/dispatch": DispatchPage,
  "/events": EventsPage
} as const;

const active = ref<string>(location.hash.replace("#", "") || "/dispatch");
const current = computed(() => routes.find((route) => route.route === active.value) ?? routes[0]);
const currentComponent = computed(() => pageComponents[active.value as keyof typeof pageComponents] ?? DashboardPage);

function navigate(route: string) {
  active.value = route;
  if (typeof location !== "undefined") location.hash = route;
}
</script>

<template>
  <div class="shell">
    <aside>
      <div class="brand">城市防灾应急物资调度系统</div>
      <nav>
        <button v-for="route in routes" :key="route.route" :class="{ active: active === route.route }" @click="navigate(route.route)">
          {{ route.name }}
        </button>
      </nav>
      <p class="aside-note">数据仅保存在本地，审批/出库/签收结果刷新后仍保留。</p>
    </aside>
    <main class="page">
      <section class="page-head">
        <div><p class="eyebrow">rescue-stock</p><h1>{{ current?.name }}</h1></div>
        <StatusBadge value="LOCAL_DATA" />
      </section>
      <component :is="currentComponent" />
    </main>
  </div>
</template>
