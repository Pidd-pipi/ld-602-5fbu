import { defineStore } from "pinia";
import { listWarehouse, saveWarehouse } from "../api/Warehouse";
import type { Warehouse } from "../types/Warehouse";

interface State {
  rows: Warehouse[];
  loading: boolean;
}

export const useWarehouseStore = defineStore("warehouse", {
  state: (): State => ({ rows: [], loading: false }),
  getters: {
    byId: (state) => (id: number) => state.rows.find((row) => row.id === id),
    activeRows: (state) => state.rows.filter((row) => row.status === "ACTIVE")
  },
  actions: {
    async load() {
      this.loading = true;
      try {
        this.rows = await listWarehouse();
      } finally {
        this.loading = false;
      }
    },
    async upsert(row: Warehouse) {
      const saved = await saveWarehouse(row);
      const index = this.rows.findIndex((item) => item.id === saved.id);
      if (index >= 0) this.rows[index] = saved;
      else this.rows.push(saved);
      return saved;
    },
    /** 启停用必须登记原因，停用原因会展示在调拨审批的拦截说明里 */
    async toggleStatus(id: number, reason: string) {
      const row = this.byId(id);
      if (!row) return;
      if (row.status === "ACTIVE" && !reason.trim()) {
        throw new Error("停用仓库时必须填写原因");
      }
      const next: Warehouse = {
        ...row,
        status: row.status === "ACTIVE" ? "DISABLED" : "ACTIVE",
        disabled_reason: row.status === "ACTIVE" ? reason.trim() : ""
      };
      return this.upsert(next);
    }
  }
});
