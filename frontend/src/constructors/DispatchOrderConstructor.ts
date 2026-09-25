import type { DispatchLine } from "../types/DispatchLine";
import type { DispatchOrder } from "../types/DispatchOrder";
import type { ApprovalTimelineEntry } from "../types/ApprovalTimeline";

const nowIso = () => new Date().toISOString();

export const createDefaultDispatchLine = (overrides: Partial<DispatchLine> = {}): DispatchLine => ({
  id: 0,
  supply_item_id: 0,
  quantity: 1,
  available_quantity: 0,
  gap_quantity: 0,
  excluded_expired_quantity: 0,
  excluded_quarantined_quantity: 0,
  safety_stock: 0,
  post_remaining: 0,
  below_safety_after: false,
  allocations: [],
  ...overrides
});

export const createDefaultTimelineEntry = (
  overrides: Partial<ApprovalTimelineEntry> = {}
): ApprovalTimelineEntry => ({
  id: 0,
  action: "SUBMIT",
  actor: "",
  note: "",
  created_at: nowIso(),
  ...overrides
});

/** 避难点提交物资申请用的表单结构 */
export interface DispatchRequestForm {
  source_warehouse_id: number;
  shelter_id: number;
  event_name: string;
  priority: DispatchOrder["priority"];
  requested_by: string;
  items: { supply_item_id: number; quantity: number }[];
}

export const createDispatchRequestForm = (
  overrides: Partial<DispatchRequestForm> = {}
): DispatchRequestForm => ({
  source_warehouse_id: 1,
  shelter_id: 1,
  event_name: "",
  priority: "NORMAL",
  requested_by: "",
  items: [{ supply_item_id: 1, quantity: 1 }],
  ...overrides
});

export const createDefaultDispatchOrder = (
  overrides: Partial<DispatchOrder> = {}
): DispatchOrder => ({
  id: 0,
  order_no: "",
  event_id: null,
  event_name: "",
  source_warehouse_id: 1,
  shelter_id: 1,
  priority: "NORMAL",
  status: "SUBMITTED",
  requested_by: "",
  approved_by: "",
  received_by: "",
  created_at: nowIso(),
  approved_at: "",
  dispatched_at: "",
  received_at: "",
  lines: [],
  timeline: [],
  blocking_reasons: [],
  warning_reasons: [],
  force_reason: "",
  reject_reason: "",
  receive_note: "",
  ...overrides
});

export const createDispatchOrderForm = createDefaultDispatchOrder;
export const createDispatchOrderResponse = createDefaultDispatchOrder;

/** 由避难点申请表构造一张待审批调拨单 */
export const buildDispatchOrderFromForm = (
  id: number,
  form: DispatchRequestForm,
  safetyOf: (supplyItemId: number) => number,
  lineIdStart = 1
): DispatchOrder => {
  const stamp = nowIso();
  const datePart = stamp.slice(0, 10).replace(/-/g, "");
  return createDefaultDispatchOrder({
    id,
    order_no: `DB-${datePart}-${String(id).padStart(3, "0")}`,
    source_warehouse_id: form.source_warehouse_id,
    shelter_id: form.shelter_id,
    event_name: form.event_name || "日常物资补充",
    priority: form.priority,
    requested_by: form.requested_by,
    status: "SUBMITTED",
    created_at: stamp,
    lines: form.items
      .filter((row) => row.supply_item_id > 0 && row.quantity > 0)
      .map((row, index) =>
        createDefaultDispatchLine({
          id: lineIdStart + index,
          supply_item_id: row.supply_item_id,
          quantity: row.quantity,
          safety_stock: safetyOf(row.supply_item_id)
        })
      ),
    timeline: [
      createDefaultTimelineEntry({
        action: "SUBMIT",
        actor: form.requested_by || "避难点",
        note: `避难点提交物资申请，共 ${form.items.length} 类物资`,
        created_at: stamp
      })
    ]
  });
};
