import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 20102,
    host: "0.0.0.0",
    // 前端代码统一请求相对路径 /api；本地联调代理到后端（target 不带末尾斜杠以保留 /api 前缀）
    proxy: {
      "/api": {
        target: "http://127.0.0.1:21102",
        changeOrigin: true
      },
      "/health": {
        target: "http://127.0.0.1:21102",
        changeOrigin: true
      }
    }
  }
});
