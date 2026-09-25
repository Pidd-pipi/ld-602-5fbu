import { defineStore } from "pinia";
import { listInventoryBatch } from "../api/InventoryBatch";
import type { InventoryBatch } from "../types/InventoryBatch";

interface State {
  rows: InventoryBatch[];
  loading: boolean;
}

export const useInventoryBatchStore = defineStore("inventoryBatch", {
  state: (): State => ({ rows: [], loading: false }),
  getters: {
    byWarehouse: (state) => (warehouseId: number) =>
      state.rows.filter((row) => row.warehouse_id === warehouseId),
    totalRemaining: (state) =>
      state.rows.reduce((sum, batch) => sum + batch.remaining_quantity, 0)
  },
  actions: {
    async load() {
      this.loading = true;
      try {
        this.rows = await listInventoryBatch();
      } finally {
        this.loading = false;
      }
    }
  }
});
