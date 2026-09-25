import { requestJson, ApiUnavailableError } from "./http";
import { localList, localSave } from "../services/localGateway";
import type { DispatchOrder } from "../types/DispatchOrder";
import type { ApprovalPlan } from "../types/AllocationPlan";
import type { DispatchRequestForm } from "../constructors/DispatchOrderConstructor";
import {
  approveOrder,
  dispatchOrder,
  receiveOrder,
  rejectOrder,
  previewApproval,
  type ApproveResult
} from "../services/dispatchWorkflow";
import { buildDispatchOrderFromForm } from "../constructors/DispatchOrderConstructor";

const endpoint = "/api/dispatch-order";

/** 读取：优先后端，离线回退本地持久数据（切换页面/刷新进度不丢） */
export async function listDispatchOrder(): Promise<DispatchOrder[]> {
  try {
    return await requestJson<DispatchOrder[]>(endpoint);
  } catch {
    return localList("dispatchOrder");
  }
}

/** 详情页审批预览：来源仓库、批次剩余量、到期日、缺口、安全库存影响 */
export function previewDispatchApproval(
  order: DispatchOrder
): ApprovalPlan {
  return previewApproval(
    order,
    localList("warehouse"),
    localList("inventoryBatch"),
    localList("supplyItem")
  );
}

/** 尝试后端动作接口；离线时返回 null 由本地工作流接管 */
async function tryRemoteAction<T>(path: string, body: unknown): Promise<T | null> {
  try {
    return await requestJson<T>(path, { method: "POST", body });
  } catch (error) {
    if (error instanceof ApiUnavailableError) return null;
    return null;
  }
}

const persist = (orders: DispatchOrder[], batches = localList("inventoryBatch")) => {
  localSave("dispatchOrder", orders);
  localSave("inventoryBatch", batches);
};

/** 批准：先算 FEFO 计划；库存不足保持待审并列缺口；低于安全库存需原因 */
export async function approveDispatchOrder(
  orderId: number,
  actor: string,
  forceReason = ""
): Promise<ApproveResult> {
  const remote = await tryRemoteAction<ApproveResult>(`${endpoint}/${orderId}/approve`, {
    actor,
    force_reason: forceReason
  });
  if (remote) return remote;

  const orders = localList("dispatchOrder");
  const batches = localList("inventoryBatch");
  const result = approveOrder(
    orders,
    orderId,
    localList("warehouse"),
    batches,
    localList("supplyItem"),
    { actor, forceReason }
  );
  persist(orders, batches);
  return result;
}

/** 出库：按批准冻结的 FEFO 批次扣减 remaining_quantity */
export async function dispatchDispatchOrder(
  orderId: number,
  actor: string,
  vehicleNote = ""
): Promise<DispatchOrder> {
  const remote = await tryRemoteAction<DispatchOrder>(`${endpoint}/${orderId}/dispatch`, {
    actor,
    vehicle_note: vehicleNote
  });
  if (remote) return remote;

  const orders = localList("dispatchOrder");
  const batches = localList("inventoryBatch");
  const { order } = dispatchOrder(orders, batches, orderId, actor, vehicleNote);
  persist(orders, batches);
  return order;
}

/** 签收：避难点确认数量批次 */
export async function receiveDispatchOrder(
  orderId: number,
  actor: string,
  note = ""
): Promise<DispatchOrder> {
  const remote = await tryRemoteAction<DispatchOrder>(`${endpoint}/${orderId}/receive`, {
    actor,
    note
  });
  if (remote) return remote;

  const orders = localList("dispatchOrder");
  const order = receiveOrder(orders, orderId, actor, note);
  persist(orders);
  return order;
}

/** 驳回：必须填原因 */
export async function rejectDispatchOrder(
  orderId: number,
  actor: string,
  reason: string
): Promise<DispatchOrder> {
  const remote = await tryRemoteAction<DispatchOrder>(`${endpoint}/${orderId}/reject`, {
    actor,
    reason
  });
  if (remote) return remote;

  const orders = localList("dispatchOrder");
  const order = rejectOrder(orders, orderId, actor, reason);
  persist(orders);
  return order;
}

/** 避难点提交物资申请，生成待审批调拨单 */
export async function createDispatchRequest(form: DispatchRequestForm): Promise<DispatchOrder> {
  const remote = await tryRemoteAction<DispatchOrder>(endpoint, form);
  if (remote) return remote;

  const orders = localList("dispatchOrder");
  const nextId = orders.reduce((max, row) => Math.max(max, row.id), 0) + 1;
  const nextLineId =
    orders.reduce((max, row) => Math.max(max, ...row.lines.map((l) => l.id)), 0) + 1;
  const items = localList("supplyItem");
  const order = buildDispatchOrderFromForm(
    nextId,
    form,
    (supplyItemId) => items.find((item) => item.id === supplyItemId)?.safety_stock ?? 0,
    nextLineId
  );
  orders.unshift(order);
  persist(orders);
  return order;
}

export async function saveDispatchOrder(payload: DispatchOrder): Promise<DispatchOrder> {
  const orders = localList("dispatchOrder");
  const index = orders.findIndex((row) => row.id === payload.id);
  if (index >= 0) orders[index] = payload;
  else orders.unshift(payload);
  persist(orders);
  return payload;
}
