import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";
import DashboardPage from "../pages/DashboardPage.vue";
import WarehousesPage from "../pages/WarehousesPage.vue";
import SheltersPage from "../pages/SheltersPage.vue";
import DispatchPage from "../pages/DispatchPage.vue";
import EventsPage from "../pages/EventsPage.vue";

export const routes: RouteRecordRaw[] = [
  { path: "/", redirect: "/dashboard" },
  { path: "/dashboard", name: "dashboard", component: DashboardPage, meta: { title: "应急态势大屏" } },
  { path: "/warehouses", name: "warehouses", component: WarehousesPage, meta: { title: "仓库库存" } },
  { path: "/shelters", name: "shelters", component: SheltersPage, meta: { title: "避难点管理" } },
  { path: "/dispatch", name: "dispatch", component: DispatchPage, meta: { title: "调拨审批" } },
  { path: "/events", name: "events", component: EventsPage, meta: { title: "事件响应" } }
];

export const router = createRouter({
  history: createWebHistory(),
  routes
});

/** 路由守卫：所有页面均需进入系统；标题同步，切换页面后业务进度由 store/localStorage 保留 */
router.beforeEach((to) => {
  if (to.meta.title) document.title = `${String(to.meta.title)} · 城市防灾应急物资调度系统`;
  return true;
});
