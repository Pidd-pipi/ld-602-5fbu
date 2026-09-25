import { defineStore } from "pinia";
import { loadSnapshot, resetSnapshot, type PersistSnapshot } from "../services/localRepository";
import { loadRemoteSnapshot, approveRemote, dispatchRemote, receiveRemote, rejectRemote } from "../services/remoteSnapshot";
import {
  approveDispatch,
  dispatchOrder,
  receiveOrder,
  rejectOrder,
  previewDispatch,
  DispatchFlowError
} from "../services/dispatchWorkflow";
import type { DispatchPlan } from "../services/dispatchPlanner";
import type { DispatchOrder } from "../types/DispatchOrder";

/**
 * 调拨审批 store：后端在线时走 REST（/api/dispatch-order/...），
 * 离线评审时自动回退本地 FEFO 工作流；两种模式都会把结果落到快照，
 * 因此审批/出库/签收结果在切换页面后仍能看到。
 */
export const useDispatchOrderStore = defineStore("dispatchOrder", {
  state: () => ({
    snapshot: null as PersistSnapshot | null,
    loading: false,
    /** online=使用后端接口；local=离线本地工作流 */
    source: "local" as "online" | "local",
    error: ""
  }),
  getters: {
    rows(state): DispatchOrder[] {
      return state.snapshot?.dispatchOrder ?? [];
    }
  },
  actions: {
    async load() {
      this.loading = true;
      try {
        this.snapshot = await loadRemoteSnapshot();
        this.source = "online";
      } catch {
        // 后端不可用：使用本地持久化快照，流程仍可完整操作
        this.snapshot = loadSnapshot();
        this.source = "local";
      } finally {
        this.loading = false;
      }
    },
    resetDemo() {
      this.snapshot = resetSnapshot();
      this.source = "local";
      this.error = "";
    },
    preview(orderId: number): DispatchPlan | null {
      if (!this.snapshot) return null;
      return previewDispatch(this.snapshot, orderId);
    },
    setErrorMessage(cause: unknown, fallback: string) {
      this.error = cause instanceof DispatchFlowError || cause instanceof Error ? cause.message : fallback;
    },
    /** 返回 true 表示批准通过；false 表示保持待审（缺口/停用/校验失败） */
    async approve(orderId: number, actor: string, safetyReason: string, note: string): Promise<boolean> {
      if (this.source === "online") {
        try {
          await approveRemote(orderId, { actor, safetyReason, note });
          await this.load();
          this.error = "";
          return this.rows.find((entry) => entry.id === orderId)?.status === "APPROVED";
        } catch (cause) {
          this.setErrorMessage(cause, "批准失败，请重试");
          return false;
        }
      }
      if (!this.snapshot) return false;
      try {
        const next = approveDispatch(this.snapshot, { orderId, actor, safetyReason, note });
        this.snapshot = structuredClone(next);
        this.error = "";
        return next.dispatchOrder.find((entry) => entry.id === orderId)?.status === "APPROVED";
      } catch (cause) {
        this.setErrorMessage(cause, "批准失败，请重试");
        return false;
      }
    },
    async dispatch(orderId: number, actor: string): Promise<boolean> {
      if (this.source === "online") {
        try {
          await dispatchRemote(orderId, { actor });
          await this.load();
          this.error = "";
          return true;
        } catch (cause) {
          this.setErrorMessage(cause, "出库失败，请重试");
          return false;
        }
      }
      if (!this.snapshot) return false;
      try {
        this.snapshot = structuredClone(dispatchOrder(this.snapshot, orderId, actor));
        this.error = "";
        return true;
      } catch (cause) {
        this.setErrorMessage(cause, "出库失败，请重试");
        return false;
      }
    },
    async receive(orderId: number, actor: string, remark: string): Promise<boolean> {
      if (this.source === "online") {
        try {
          await receiveRemote(orderId, { actor, remark });
          await this.load();
          this.error = "";
          return true;
        } catch (cause) {
          this.setErrorMessage(cause, "签收失败，请重试");
          return false;
        }
      }
      if (!this.snapshot) return false;
      try {
        this.snapshot = structuredClone(receiveOrder(this.snapshot, orderId, actor, remark));
        this.error = "";
        return true;
      } catch (cause) {
        this.setErrorMessage(cause, "签收失败，请重试");
        return false;
      }
    },
    async reject(orderId: number, actor: string, reason: string): Promise<boolean> {
      if (this.source === "online") {
        try {
          await rejectRemote(orderId, { actor, reason });
          await this.load();
          this.error = "";
          return true;
        } catch (cause) {
          this.setErrorMessage(cause, "驳回失败");
          return false;
        }
      }
      if (!this.snapshot) return false;
      try {
        this.snapshot = structuredClone(rejectOrder(this.snapshot, orderId, actor, reason));
        this.error = "";
        return true;
      } catch (cause) {
        this.setErrorMessage(cause, "驳回失败");
        return false;
      }
    }
  }
});
