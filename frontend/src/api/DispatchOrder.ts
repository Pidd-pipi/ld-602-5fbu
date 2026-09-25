import { mockData } from "../mocks/seedData";
import type { DispatchOrder } from "../types/DispatchOrder";
import { loadSnapshot } from "../services/localRepository";

const endpoint = "/api/dispatch-order";

/** 读取调拨单（含明细、批次方案、缺口、时间线进度），结果在页面切换后保持一致 */
export async function listDispatchOrder(): Promise<DispatchOrder[]> {
  try {
    const res = await fetch(endpoint, { headers: { Accept: "application/json" } });
    if (res.ok) {
      const body = (await res.json()) as unknown;
      if (Array.isArray(body) && body.length > 0 && "order_no" in (body[0] as Record<string, unknown>)) {
        return body as DispatchOrder[];
      }
    }
  } catch {
    // 后端不可用时回退本地数据源，保证审批流程可操作。
  }
  const local = loadSnapshot();
  if (local.dispatchOrder.length > 0) return local.dispatchOrder;
  return [...(mockData.dispatchOrder as unknown as DispatchOrder[])];
}

export async function saveDispatchOrder(payload: DispatchOrder) {
  console.info("save DispatchOrder", payload);
  return payload;
}
