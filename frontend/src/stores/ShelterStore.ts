import { defineStore } from "pinia";
import { listShelter } from "../api/Shelter";
import type { Shelter } from "../types/Shelter";

interface State {
  rows: Shelter[];
  loading: boolean;
}

export const useShelterStore = defineStore("shelter", {
  state: (): State => ({ rows: [], loading: false }),
  getters: {
    byId: (state) => (id: number) => state.rows.find((row) => row.id === id)
  },
  actions: {
    async load() {
      this.loading = true;
      try {
        this.rows = await listShelter();
      } finally {
        this.loading = false;
      }
    }
  }
});
