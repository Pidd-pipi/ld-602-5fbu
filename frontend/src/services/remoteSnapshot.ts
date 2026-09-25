import type { DispatchOrder } from "../types/DispatchOrder";
import type { InventoryBatch } from "../types/InventoryBatch";
import type { Warehouse } from "../types/Warehouse";
import type { SupplyItem } from "../types/SupplyItem";
import type { Shelter } from "../types/Shelter";
import type { PersistSnapshot } from "./localRepository";
import { saveSnapshot } from "./localRepository";

async function getJson<T>(path: string, shapeKey: string): Promise<T[]> {
  const res = await fetch(path, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`GET ${path} -> ${res.status}`);
  const body = (await res.json()) as unknown;
  if (!Array.isArray(body) || (body.length > 0 && !(shapeKey in (body[0] as Record<string, unknown>)))) {
    throw new Error(`GET ${path} 返回结构不匹配`);
  }
  return body as T[];
}

/**
 * 后端在线时整体拉取 5 张表并落盘，保证本地缓存与接口一致；
 * 任一接口不可用则抛错，由调用方回退本地数据。
 */
export async function loadRemoteSnapshot(): Promise<PersistSnapshot> {
  const [warehouse, supplyItem, inventoryBatch, shelter, dispatchOrder] = await Promise.all([
    getJson<Warehouse>("/api/warehouse", "name"),
    getJson<SupplyItem>("/api/supply-item", "sku_code"),
    getJson<InventoryBatch>("/api/inventory-batch", "batch_no"),
    getJson<Shelter>("/api/shelter", "name"),
    getJson<DispatchOrder>("/api/dispatch-order", "order_no")
  ]);
  return saveSnapshot({ warehouse, supplyItem, inventoryBatch, shelter, dispatchOrder });
}

export interface ApproveRequestBody {
  actor: string;
  safetyReason?: string;
  note?: string;
}

export interface ActionRequestBody {
  actor: string;
  remark?: string;
  reason?: string;
}

async function postAction(path: string, body: unknown): Promise<DispatchOrder> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body)
  });
  const payload = (await res.json().catch(() => null)) as DispatchOrder | { code?: string; message?: string } | null;
  if (!res.ok || !payload || !("order_no" in payload)) {
    throw new Error(((payload as { message?: string } | null)?.message) ?? `POST ${path} -> ${res.status}`);
  }
  return payload as DispatchOrder;
}

export const approveRemote = (id: number, body: ApproveRequestBody) =>
  postAction(`/api/dispatch-order/${id}/approve`, body);
export const dispatchRemote = (id: number, body: ActionRequestBody) =>
  postAction(`/api/dispatch-order/${id}/dispatch`, body);
export const receiveRemote = (id: number, body: ActionRequestBody) =>
  postAction(`/api/dispatch-order/${id}/receive`, body);
export const rejectRemote = (id: number, body: ActionRequestBody) =>
  postAction(`/api/dispatch-order/${id}/reject`, body);
