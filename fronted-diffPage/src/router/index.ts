import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    name: "dy",
    meta: {
      title: "抖音竞品迭代",
    },
    component: () =>
      import("../views/DouyinIteration.vue"),
  },
  {
    path: "/wx",
    name: "wx",
    meta: {
      title: "微信竞品迭代",
    },
    component: () =>
      import("../views/WeixinIteration.vue"),
  },
  {
    path: "/diff",
    name: "diff",
    meta: {
      title: "竞品差异对比",
    },
    component: () =>
      import("../views/DiffResult.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;
