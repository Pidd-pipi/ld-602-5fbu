<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { routes } from "./router/routes";
import RoleSwitcher from "./components/common/RoleSwitcher.vue";

const route = useRoute();
const currentTitle = computed(() => (route.meta.title as string) ?? "城市防灾应急物资调度系统");
</script>

<template>
  <div class="shell">
    <aside>
      <div class="brand">
        <strong>城市防灾应急</strong>
        <span>物资调度 rescue-stock</span>
      </div>
      <nav>
        <RouterLink
          v-for="item in routes.filter((r) => r.name)"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ active: route.path.startsWith(item.path) }"
        >
          {{ item.meta?.title }}
        </RouterLink>
      </nav>
      <div class="aside-foot">
        <p>本地数据模式</p>
        <small>审批/出库/签收进度写入浏览器，切页与刷新不丢失</small>
      </div>
    </aside>
    <main class="page">
      <section class="page-head">
        <div>
          <p class="eyebrow">rescue-stock</p>
          <h1>{{ currentTitle }}</h1>
        </div>
        <RoleSwitcher />
      </section>
      <RouterView />
    </main>
  </div>
</template>
