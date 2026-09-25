import { computed, ref } from "vue";
import type { DispatchOrder } from "../types/DispatchOrder";
import type { ApprovalPlan } from "../types/AllocationPlan";
import { previewDispatchApproval } from "../api/DispatchOrder";
import { WorkflowError } from "../services/dispatchWorkflow";
import { useSessionStore } from "../stores/SessionStore";
import { useDispatchOrderStore } from "../stores/DispatchOrderStore";
import { canPerform } from "../constants/roles";
import { ERROR_MESSAGES } from "../constants/errorMessages";

type DispatchStore = ReturnType<typeof useDispatchOrderStore>;

export interface DispatchFlowHandlers {
  onBlocked?: (order: DispatchOrder, plan: ApprovalPlan) => void;
  onApproved?: (order: DispatchOrder, plan: ApprovalPlan) => void;
}

/**
 * 调拨审批流动作封装：批准（含缺口/安全库存处理）、出库、签收、驳回。
 * 所有动作先经 RBAC 显隐之外的二次校验，错误以 WorkflowError 抛出由页面提示。
 */
export function useDispatchFlow(
  store: DispatchStore,
  handlers: DispatchFlowHandlers = {}
) {
  const acting = ref(false);
  const actionError = ref("");
  const session = useSessionStore();

  const ensurePermission = (action: "approve" | "reject" | "dispatch" | "receive") => {
    if (!canPerform(session.role, action)) {
      throw new WorkflowError("RBAC_DENIED", ERROR_MESSAGES.RBAC_DENIED);
    }
  };

  /** 详情页实时审批预览（FEFO 批次、剩余量、到期日、缺口） */
  const planOf = (order: DispatchOrder): ApprovalPlan => previewDispatchApproval(order);

  const approve = async (order: DispatchOrder, forceReason = "") => {
    ensurePermission("approve");
    acting.value = true;
    actionError.value = "";
    try {
      const result = await store.approve(order.id, session.actorName, forceReason);
      if (result.blocked) handlers.onBlocked?.(result.order, result.plan);
      else handlers.onApproved?.(result.order, result.plan);
      return result;
    } catch (error) {
      actionError.value = error instanceof Error ? error.message : String(error);
      throw error;
    } finally {
      acting.value = false;
    }
  };

  const dispatch = async (order: DispatchOrder, vehicleNote = "") => {
    ensurePermission("dispatch");
    acting.value = true;
    try {
      // 出库会扣减批次库存，批次 store 由页面在动作后重新 load
      return await store.dispatch(order.id, session.actorName, vehicleNote);
    } finally {
      acting.value = false;
    }
  };

  const receive = async (order: DispatchOrder, note = "") => {
    ensurePermission("receive");
    acting.value = true;
    try {
      return await store.receive(order.id, session.actorName, note);
    } finally {
      acting.value = false;
    }
  };

  const reject = async (order: DispatchOrder, reason: string) => {
    ensurePermission("reject");
    acting.value = true;
    try {
      return await store.reject(order.id, session.actorName, reason);
    } finally {
      acting.value = false;
    }
  };

  const visibleActions = computed(() => ({
    canApprove: canPerform(session.role, "approve"),
    canReject: canPerform(session.role, "reject"),
    canDispatch: canPerform(session.role, "dispatch"),
    canReceive: canPerform(session.role, "receive"),
    canCreate: canPerform(session.role, "create"),
    canToggleWarehouse: canPerform(session.role, "toggleWarehouse")
  }));

  return { acting, actionError, planOf, approve, dispatch, receive, reject, visibleActions };
}
