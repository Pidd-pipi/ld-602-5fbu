import { defineStore } from "pinia";
import {
  listDispatchOrder,
  approveDispatchOrder,
  dispatchDispatchOrder,
  receiveDispatchOrder,
  rejectDispatchOrder,
  createDispatchRequest
} from "../api/DispatchOrder";
import type { DispatchOrder } from "../types/DispatchOrder";
import type { DispatchRequestForm } from "../constructors/DispatchOrderConstructor";
import type { ApproveResult } from "../services/dispatchWorkflow";

interface State {
  rows: DispatchOrder[];
  loading: boolean;
  lastError: string;
}

export const useDispatchOrderStore = defineStore("dispatchOrder", {
  state: (): State => ({ rows: [], loading: false, lastError: "" }),
  getters: {
    byId: (state) => (id: number) => state.rows.find((row) => row.id === id),
    pendingRows: (state) =>
      state.rows.filter((row) => row.status === "SUBMITTED")
  },
  actions: {
    async load(force = false) {
      if (this.loading) return;
      this.loading = true;
      this.lastError = "";
      try {
        this.rows = await listDispatchOrder();
      } finally {
        this.loading = false;
      }
      void force;
    },
    /** 本地动作执行后用返回值就地更新，保证切走再回来进度仍在 */
    upsert(order: DispatchOrder) {
      const index = this.rows.findIndex((row) => row.id === order.id);
      if (index >= 0) this.rows[index] = order;
      else this.rows.unshift(order);
    },
    async submitRequest(form: DispatchRequestForm) {
      const order = await createDispatchRequest(form);
      this.upsert(order);
      return order;
    },
    async approve(id: number, actor: string, forceReason = ""): Promise<ApproveResult> {
      const result = await approveDispatchOrder(id, actor, forceReason);
      this.upsert(result.order);
      return result;
    },
    async dispatch(id: number, actor: string, vehicleNote = "") {
      const order = await dispatchDispatchOrder(id, actor, vehicleNote);
      this.upsert(order);
      return order;
    },
    async receive(id: number, actor: string, note = "") {
      const order = await receiveDispatchOrder(id, actor, note);
      this.upsert(order);
      return order;
    },
    async reject(id: number, actor: string, reason: string) {
      const order = await rejectDispatchOrder(id, actor, reason);
      this.upsert(order);
      return order;
    }
  }
});
