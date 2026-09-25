import type { DispatchOrder, DispatchLine } from "../types/DispatchOrder";

/** 避难点提交申请时构造的默认调拨单（待审批，无批次方案） */
export const createDefaultDispatchOrder = (overrides: Partial<DispatchOrder> = {}): DispatchOrder => ({
  id: 0,
  order_no: "",
  event_id: 0,
  event_name: "",
  source_warehouse_id: 0,
  source_warehouse_name: "",
  shelter_id: 0,
  shelter_name: "",
  priority: "NORMAL",
  status: "SUBMITTED",
  requested_by: "",
  requested_at: new Date().toISOString(),
  approved_by: "",
  approved_at: "",
  dispatched_at: "",
  received_at: "",
  decision_note: "",
  lines: [],
  gaps: [],
  block_reasons: [],
  progress: [{ status: "SUBMITTED", at: new Date().toISOString(), actor: "", remark: "避难点提交物资申请" }],
  ...overrides
});

export const createDispatchOrderForm = (overrides: Partial<DispatchOrder> = {}): DispatchOrder =>
  createDefaultDispatchOrder(overrides);

export const createDispatchOrderResponse = createDefaultDispatchOrder;

/** 申请明细行构造器：新增物资申请行时使用 */
export const createDispatchLine = (overrides: Partial<DispatchLine> = {}): DispatchLine => ({
  id: 0,
  supply_item_id: 0,
  supply_name: "",
  sku_code: "",
  unit: "",
  requested_quantity: 0,
  allocations: [],
  ...overrides
});
