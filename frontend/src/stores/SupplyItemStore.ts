import { defineStore } from "pinia";
import { listSupplyItem } from "../api/SupplyItem";
import type { SupplyItem } from "../types/SupplyItem";

interface State {
  rows: SupplyItem[];
  loading: boolean;
}

export const useSupplyItemStore = defineStore("supplyItem", {
  state: (): State => ({ rows: [], loading: false }),
  getters: {
    byId: (state) => (id: number) => state.rows.find((row) => row.id === id)
  },
  actions: {
    async load() {
      this.loading = true;
      try {
        this.rows = await listSupplyItem();
      } finally {
        this.loading = false;
      }
    }
  }
});
