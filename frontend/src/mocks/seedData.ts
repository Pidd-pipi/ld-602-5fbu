import type { Warehouse } from "../types/Warehouse";
import type { SupplyItem } from "../types/SupplyItem";
import type { InventoryBatch } from "../types/InventoryBatch";
import type { Shelter } from "../types/Shelter";
import type { DispatchOrder } from "../types/DispatchOrder";
import type { BatchAllocation } from "../types/AllocationPlan";

/**
 * 全部本地种子数据，禁止接入第三方 API。
 * 日期相对“今天”生成，保证任何时间打开都能看到临期/过期批次。
 */
const DAY = 86_400_000;
const now = new Date();
const at = (dayOffset: number, hour = 9): string =>
  new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset, hour, 0, 0).toISOString();
const ago = (dayOffset: number, hour = 9): string => at(-dayOffset, hour);

export const seedWarehouses: Warehouse[] = [
  {
    id: 1,
    name: "城东应急中心仓",
    district: "江东区",
    address: "江东区望江路 88 号",
    manager_id: 101,
    manager_name: "王仓库",
    capacity_level: 3,
    contact_phone: "0571-88001101",
    status: "ACTIVE",
    disabled_reason: ""
  },
  {
    id: 2,
    name: "滨江战备仓",
    district: "滨江区",
    address: "滨江区江南大道 1200 号",
    manager_id: 102,
    manager_name: "李保管",
    capacity_level: 2,
    contact_phone: "0571-88002202",
    status: "ACTIVE",
    disabled_reason: ""
  },
  {
    id: 3,
    name: "西湖临时周转仓",
    district: "西湖区",
    address: "西湖区灵隐支路 17 号",
    manager_id: 103,
    manager_name: "赵周转",
    capacity_level: 1,
    contact_phone: "0571-88003303",
    status: "DISABLED",
    disabled_reason: "库房消防整改，2026-09-20 起暂停一切调拨，预计停用 15 天"
  }
];

export const seedSupplyItems: SupplyItem[] = [
  { id: 1, sku_code: "WATER-550", name: "瓶装饮用水 550ml", category: "WATER", unit: "箱", safety_stock: 100, expire_days: 720, storage_requirement: "常温避光" },
  { id: 2, sku_code: "FOOD-MRE", name: "自热应急口粮", category: "FOOD", unit: "箱", safety_stock: 80, expire_days: 540, storage_requirement: "常温干燥" },
  { id: 3, sku_code: "MED-KIT01", name: "急救包（基础型）", category: "MEDICAL", unit: "件", safety_stock: 60, expire_days: 1095, storage_requirement: "防潮" },
  { id: 4, sku_code: "SHL-TENT", name: "12 ㎡棉帐篷", category: "SHELTER", unit: "顶", safety_stock: 20, expire_days: 1825, storage_requirement: "干燥通风" },
  { id: 5, sku_code: "TOOL-GEN", name: "5kW 汽油发电机", category: "RESCUE_TOOL", unit: "台", safety_stock: 5, expire_days: 2555, storage_requirement: "防雨" },
  { id: 6, sku_code: "MED-MASK", name: "医用防护口罩", category: "MEDICAL", unit: "箱", safety_stock: 40, expire_days: 730, storage_requirement: "密封防潮" }
];

const batch = (
  id: number,
  warehouseId: number,
  supplyItemId: number,
  batchNo: string,
  remaining: number,
  expireOffsetDays: number,
  inboundSource: string,
  quality: InventoryBatch["quality_status"],
  total?: number
): InventoryBatch => ({
  id,
  warehouse_id: warehouseId,
  supply_item_id: supplyItemId,
  batch_no: batchNo,
  quantity: total ?? remaining,
  remaining_quantity: remaining,
  expire_at: at(expireOffsetDays),
  inbound_source: inboundSource,
  quality_status: quality
});

export const seedInventoryBatches: InventoryBatch[] = [
  // 城东中心仓：饮用水有临期批 + 正常批；口粮临期；帐篷充足；发电机吃紧
  batch(1, 1, 1, "W1-WATER-2406", 40, 12, "市应急局季度配发", "NEAR_EXPIRY", 120),
  batch(2, 1, 1, "W1-WATER-2509", 200, 300, "市级储备轮换", "QUALIFIED", 200),
  batch(3, 1, 2, "W1-FOOD-2405", 30, 8, "社会捐赠（临期）", "NEAR_EXPIRY", 60),
  batch(4, 1, 2, "W1-FOOD-2506", 150, 400, "定点采购", "QUALIFIED", 150),
  batch(5, 1, 3, "W1-MEDK-2501", 20, -20, "超期未轮换", "EXPIRED", 40),
  batch(6, 1, 3, "W1-MEDK-2508", 70, 500, "市卫健委配发", "QUALIFIED", 70),
  batch(7, 1, 4, "W1-TENT-2401", 25, 900, "省厅调拨", "QUALIFIED", 30),
  batch(8, 1, 5, "W1-GEN-2302", 6, 1500, "省厅调拨", "QUALIFIED", 8),
  batch(9, 1, 6, "W1-MASK-2404", 50, -5, "防汛物资退库", "EXPIRED", 50),
  // 滨江战备仓
  batch(10, 2, 1, "W2-WATER-2501", 90, 25, "区级配发", "NEAR_EXPIRY", 100),
  batch(11, 2, 1, "W2-WATER-2507", 120, 260, "区级配发", "QUALIFIED", 120),
  batch(12, 2, 2, "W2-FOOD-2503", 55, 360, "定点采购", "QUALIFIED", 55),
  batch(13, 2, 4, "W2-TENT-2309", 10, 20, "应急退库物资", "NEAR_EXPIRY", 12),
  batch(14, 2, 5, "W2-GEN-2401", 4, 1200, "区级配发", "QUALIFIED", 4),
  // 西湖周转仓（已停用，批次不应参与分配）
  batch(15, 3, 1, "W3-WATER-2505", 60, 180, "区级配发", "QUALIFIED", 60),
  batch(16, 3, 4, "W3-TENT-2406", 8, 600, "区民政局调拨", "QUALIFIED", 8)
];

export const seedShelters: Shelter[] = [
  { id: 1, name: "望江社区避难点", district: "江东区", capacity: 500, current_population: 320, contact_person: "陈主任", contact_phone: "13900001111", risk_level: "HIGH", open_status: "OPEN" },
  { id: 2, name: "长河街道文体中心", district: "滨江区", capacity: 800, current_population: 120, contact_person: "孙干事", contact_phone: "13900002222", risk_level: "MEDIUM", open_status: "STANDBY" },
  { id: 3, name: "灵隐街道安置点", district: "西湖区", capacity: 300, current_population: 0, contact_person: "周站长", contact_phone: "13900003333", risk_level: "LOW", open_status: "CLOSED" },
  { id: 4, name: "东站枢纽应急安置区", district: "江干区", capacity: 1000, current_population: 980, contact_person: "吴指挥", contact_phone: "13900004444", risk_level: "CRITICAL", open_status: "FULL" }
];

type Alloc = Omit<BatchAllocation, "remaining_before" | "remaining_after" | "near_expiry" | "quality_status">;

/** 用当前批次剩余量反填快照（历史单据保持当时扣减后的数量） */
const allocSnapshot = (
  a: Alloc,
  batches: InventoryBatch[],
  consumed: boolean
): BatchAllocation => {
  const b = batches.find((x) => x.id === a.batch_id)!;
  const near = b.quality_status === "NEAR_EXPIRY";
  return {
    ...a,
    quality_status: b.quality_status,
    near_expiry: near,
    remaining_before: consumed ? b.remaining_quantity + a.allocate_quantity : b.remaining_quantity,
    remaining_after: consumed ? b.remaining_quantity : b.remaining_quantity - a.allocate_quantity
  };
};

let timelineSeq = 100;
const tl = (action: "SUBMIT" | "CHECK" | "APPROVE" | "REJECT" | "DISPATCH" | "RECEIVE", actor: string, note: string, when: string) =>
  ({ id: timelineSeq++, action, actor, note, created_at: when });

const line = (
  id: number,
  supplyItemId: number,
  quantity: number,
  available: number,
  safety: number,
  post: number,
  allocations: BatchAllocation[],
  excluded?: { expired?: number; quarantined?: number }
): import("../types/DispatchLine").DispatchLine => ({
  id,
  supply_item_id: supplyItemId,
  quantity,
  available_quantity: available,
  gap_quantity: Math.max(0, quantity - available),
  excluded_expired_quantity: excluded?.expired ?? 0,
  excluded_quarantined_quantity: excluded?.quarantined ?? 0,
  safety_stock: safety,
  post_remaining: post,
  below_safety_after: post < safety,
  allocations
});

export const buildSeedDispatchOrders = (batches: InventoryBatch[]): DispatchOrder[] => {
  // 已出库/已签收的历史单据：批次已实际扣减，remaining_before = 当前剩余 + 已分配
  const dispatchedGen = allocSnapshot(
    { batch_id: 8, batch_no: "W1-GEN-2302", expire_at: at(1500), allocate_quantity: 2 },
    batches,
    true
  );
  const dispatchedTent = allocSnapshot(
    { batch_id: 7, batch_no: "W1-TENT-2401", expire_at: at(900), allocate_quantity: 3 },
    batches,
    true
  );
  const receivedWater1 = allocSnapshot(
    { batch_id: 1, batch_no: "W1-WATER-2406", expire_at: at(12), allocate_quantity: 40 },
    batches,
    true
  );
  const receivedWater2 = allocSnapshot(
    { batch_id: 2, batch_no: "W1-WATER-2509", expire_at: at(300), allocate_quantity: 10 },
    batches,
    true
  );
  const receivedFood = allocSnapshot(
    { batch_id: 3, batch_no: "W1-FOOD-2405", expire_at: at(8), allocate_quantity: 30 },
    batches,
    true
  );
  // 已批准未出库：批次冻结中（未实际扣减），remaining_before 为当前剩余
  const approvedWater1 = allocSnapshot(
    { batch_id: 10, batch_no: "W2-WATER-2501", expire_at: at(25), allocate_quantity: 50 },
    batches,
    false
  );
  const approvedWater2 = allocSnapshot(
    { batch_id: 11, batch_no: "W2-WATER-2507", expire_at: at(260), allocate_quantity: 20 },
    batches,
    false
  );
  const approvedTent = allocSnapshot(
    { batch_id: 13, batch_no: "W2-TENT-2309", expire_at: at(20), allocate_quantity: 10 },
    batches,
    false
  );

  return [
    // 1. 待审批：库存充足，出库后饮用水会低于安全库存 -> 需强制说明
    {
      id: 1,
      order_no: "DB-20260925-001",
      event_id: 1,
      event_name: "望江路段内涝",
      source_warehouse_id: 1,
      shelter_id: 1,
      priority: "URGENT",
      status: "SUBMITTED",
      requested_by: "陈主任（望江社区）",
      approved_by: "",
      received_by: "",
      created_at: ago(1, 8),
      approved_at: "",
      dispatched_at: "",
      received_at: "",
      lines: [line(1, 1, 160, 240, 100, 80, []), line(2, 2, 30, 180, 80, 150, [])],
      timeline: [tl("SUBMIT", "陈主任（望江社区）", "避难点提交物资申请：瓶装水 160 箱、自热口粮 30 箱", ago(1, 8))],
      blocking_reasons: [],
      warning_reasons: [],
      force_reason: "",
      reject_reason: "",
      receive_note: ""
    },
    // 2. 待审批：口罩只有过期批次，可用 0 -> 缺口，保持待审
    {
      id: 2,
      order_no: "DB-20260925-002",
      event_id: 2,
      event_name: "东站枢纽大客流安置",
      source_warehouse_id: 1,
      shelter_id: 4,
      priority: "HIGH",
      status: "SUBMITTED",
      requested_by: "吴指挥（东站安置区）",
      approved_by: "",
      received_by: "",
      created_at: ago(1, 14),
      approved_at: "",
      dispatched_at: "",
      received_at: "",
      lines: [
        line(3, 6, 40, 0, 40, 0, [], { expired: 50 }),
        line(4, 3, 10, 70, 60, 60, [])
      ],
      timeline: [
        tl("SUBMIT", "吴指挥（东站安置区）", "避难点提交物资申请：医用口罩 40 箱、急救包 10 件", ago(1, 14)),
        tl("CHECK", "系统", "审批校验：医用防护口罩可用批次库存为 0（批次 W1-MASK-2404 已过期 50 箱，不可出库），缺口 40 箱，单据保持待审批", ago(0, 9))
      ],
      blocking_reasons: [
        "物资「医用防护口罩」批次库存不足，缺口 40 箱（已过期批次 50 箱不可用），单据保持待审批"
      ],
      warning_reasons: [],
      force_reason: "",
      reject_reason: "",
      receive_note: ""
    },
    // 3. 待审批：来源仓库停用
    {
      id: 3,
      order_no: "DB-20260925-003",
      event_id: 3,
      event_name: "灵隐片区临时安置",
      source_warehouse_id: 3,
      shelter_id: 3,
      priority: "NORMAL",
      status: "SUBMITTED",
      requested_by: "周站长（灵隐安置点）",
      approved_by: "",
      received_by: "",
      created_at: ago(2, 10),
      approved_at: "",
      dispatched_at: "",
      received_at: "",
      lines: [line(5, 1, 20, 0, 100, 0, [])],
      timeline: [
        tl("SUBMIT", "周站长（灵隐安置点）", "避难点提交物资申请：瓶装水 20 箱", ago(2, 10)),
        tl("CHECK", "系统", "审批校验：来源仓库「西湖临时周转仓」已停用（库房消防整改，2026-09-20 起暂停一切调拨），单据保持待审批", ago(0, 9))
      ],
      blocking_reasons: [
        "来源仓库「西湖临时周转仓」已停用：库房消防整改，2026-09-20 起暂停一切调拨，预计停用 15 天"
      ],
      warning_reasons: [],
      force_reason: "",
      reject_reason: "",
      receive_note: ""
    },
    // 4. 已批准待出库（滨江仓，FEFO：先临期批 50 再正常批 20；帐篷先临期批 10）
    {
      id: 4,
      order_no: "DB-20260924-010",
      event_id: 4,
      event_name: "长河街道防汛预置",
      source_warehouse_id: 2,
      shelter_id: 2,
      priority: "HIGH",
      status: "APPROVED",
      requested_by: "孙干事（长河街道）",
      approved_by: "林审批",
      received_by: "",
      created_at: ago(2, 11),
      approved_at: ago(1, 16),
      dispatched_at: "",
      received_at: "",
      lines: [
        line(6, 1, 70, 210, 100, 140, [approvedWater1, approvedWater2]),
        line(7, 4, 10, 10, 20, 0, [approvedTent])
      ],
      timeline: [
        tl("SUBMIT", "孙干事（长河街道）", "避难点提交物资申请：瓶装水 70 箱、棉帐篷 10 顶", ago(2, 11)),
        tl("APPROVE", "林审批", "审批通过，按到期先后冻结批次：W2-WATER-2501（临期，还剩 25 天）50 箱 → W2-WATER-2507 20 箱；帐篷 W2-TENT-2309 10 顶", ago(1, 16))
      ],
      blocking_reasons: [],
      warning_reasons: ["物资「12 ㎡棉帐篷」出库后库存 0 顶将低于安全库存 20 顶"],
      force_reason: "防汛响应二级，长河街道预置点急需帐篷 10 顶，经区应急局同意先行调拨，48 小时内由市级储备补库",
      reject_reason: "",
      receive_note: ""
    },
    // 5. 已出库待签收
    {
      id: 5,
      order_no: "DB-20260923-007",
      event_id: 1,
      event_name: "望江路段内涝",
      source_warehouse_id: 1,
      shelter_id: 1,
      priority: "NORMAL",
      status: "DISPATCHED",
      requested_by: "陈主任（望江社区）",
      approved_by: "林审批",
      received_by: "",
      created_at: ago(3, 9),
      approved_at: ago(2, 15),
      dispatched_at: ago(1, 10),
      received_at: "",
      lines: [
        line(8, 5, 2, 6, 5, 4, [dispatchedGen]),
        line(9, 4, 3, 25, 20, 22, [dispatchedTent])
      ],
      timeline: [
        tl("SUBMIT", "陈主任（望江社区）", "避难点提交物资申请：发电机 2 台、棉帐篷 3 顶", ago(3, 9)),
        tl("APPROVE", "林审批", "审批通过，按到期先后冻结批次：W1-GEN-2302 2 台；W1-TENT-2401 3 顶", ago(2, 15)),
        tl("DISPATCH", "王仓库（城东中心仓）", "仓库按 FEFO 批次出库：发电机 2 台、棉帐篷 3 顶，车辆 浙A·0001应急 已发往望江社区", ago(1, 10))
      ],
      blocking_reasons: [],
      warning_reasons: ["物资「5kW 汽油发电机」出库后库存 4 台将低于安全库存 5 台"],
      force_reason: "内涝排涝必须保障临时供电，经值班领导电话批准先发，次日补采购单",
      reject_reason: "",
      receive_note: ""
    },
    // 6. 已签收：FEFO 先把临期水 40 出完再出正常批 10，口粮临期批 30 全出
    {
      id: 6,
      order_no: "DB-20260920-003",
      event_id: 5,
      event_name: "9·20 城区短时强降雨",
      source_warehouse_id: 1,
      shelter_id: 4,
      priority: "URGENT",
      status: "RECEIVED",
      requested_by: "吴指挥（东站安置区）",
      approved_by: "林审批",
      received_by: "吴指挥（东站安置区）",
      created_at: ago(6, 8),
      approved_at: ago(5, 14),
      dispatched_at: ago(5, 9),
      received_at: ago(4, 11),
      lines: [
        line(10, 1, 50, 240, 100, 190, [receivedWater1, receivedWater2]),
        line(11, 2, 30, 180, 80, 150, [receivedFood])
      ],
      timeline: [
        tl("SUBMIT", "吴指挥（东站安置区）", "避难点提交物资申请：瓶装水 50 箱、自热口粮 30 箱", ago(6, 8)),
        tl("APPROVE", "林审批", "审批通过，按到期先后冻结批次：W1-WATER-2406（临期）40 箱 → W1-WATER-2509 10 箱；W1-FOOD-2405（临期）30 箱", ago(5, 14)),
        tl("DISPATCH", "王仓库（城东中心仓）", "仓库按 FEFO 批次出库，优先清空临期批次", ago(5, 9)),
        tl("RECEIVE", "吴指挥（东站安置区）", "物资清点无误已签收：瓶装水 50 箱、自热口粮 30 箱，临期物资将优先发放", ago(4, 11))
      ],
      blocking_reasons: [],
      warning_reasons: [],
      force_reason: "",
      reject_reason: "",
      receive_note: "物资清点无误已签收，临期物资将优先发放"
    }
  ];
};

export const seedDispatchOrders: DispatchOrder[] = buildSeedDispatchOrders(seedInventoryBatches);

export const mockData = {
  warehouse: seedWarehouses,
  supplyItem: seedSupplyItems,
  inventoryBatch: seedInventoryBatches,
  shelter: seedShelters,
  dispatchOrder: seedDispatchOrders
};
