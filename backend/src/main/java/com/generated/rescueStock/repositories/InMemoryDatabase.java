package com.generated.rescueStock.repositories;

import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;
import org.springframework.stereotype.Component;
import com.generated.rescueStock.models.*;

/**
 * 进程内内存数据仓库（演示/评审环境等价于本地数据库）。
 * 仓库、物资、批次、避难点、调拨单聚合全部在此初始化，服务重启后回到种子状态。
 * 使用 @Component 而非 @Repository：内存容器无需持久化异常翻译代理，
 * 避免 CGLIB 代理绕过构造器导致种子数据字段为空。
 */
@Component
public class InMemoryDatabase {

  public Map<Long, Warehouse> warehouses = new LinkedHashMap<>();
  public Map<Long, SupplyItem> supplyItems = new LinkedHashMap<>();
  public Map<Long, InventoryBatch> batches = new LinkedHashMap<>();
  public Map<Long, Shelter> shelters = new LinkedHashMap<>();
  public Map<Long, DispatchOrderAggregate> dispatchOrders = new LinkedHashMap<>();
  public long timelineSeq = 1000;

  private static final DateTimeFormatter ISO = DateTimeFormatter.ISO_INSTANT;

  public static String at(int dayOffset) {
    return ISO.format(Instant.now().plus(Duration.ofDays(dayOffset)).atZone(ZoneOffset.UTC).toInstant());
  }

  public static String ago(int dayOffset) {
    return at(-dayOffset);
  }

  public InMemoryDatabase() {
    // 容器在构造器中显式初始化，确保所有种子方法执行前容器都已就绪
    warehouses = new LinkedHashMap<>();
    supplyItems = new LinkedHashMap<>();
    batches = new LinkedHashMap<>();
    shelters = new LinkedHashMap<>();
    dispatchOrders = new LinkedHashMap<>();
    timelineSeq = 1000;
    seedWarehouses();
    seedSupplyItems();
    seedBatches();
    seedShelters();
    seedDispatchOrders();
  }

  private void seedWarehouses() {
    warehouses.put(1L, warehouse(1L, "城东应急中心仓", "江东区", "江东区望江路 88 号", "王仓库", 3, "ACTIVE", ""));
    warehouses.put(2L, warehouse(2L, "滨江战备仓", "滨江区", "滨江区江南大道 1200 号", "李保管", 2, "ACTIVE", ""));
    warehouses.put(3L, warehouse(3L, "西湖临时周转仓", "西湖区", "西湖区灵隐支路 17 号", "赵周转", 1, "DISABLED",
        "库房消防整改，2026-09-20 起暂停一切调拨，预计停用 15 天"));
  }

  private Warehouse warehouse(long id, String name, String district, String address, String manager,
                              int capacity, String status, String disabledReason) {
    Warehouse w = new Warehouse();
    w.id = id; w.name = name; w.district = district; w.address = address;
    w.manager_id = 100 + id; w.manager_name = manager; w.capacity_level = capacity;
    w.contact_phone = "0571-8800" + String.format("%4d", id).replace(' ', '0');
    w.status = status; w.disabled_reason = disabledReason;
    return w;
  }

  private void seedSupplyItems() {
    supplyItems.put(1L, item(1L, "WATER-550", "瓶装饮用水 550ml", "WATER", "箱", 100));
    supplyItems.put(2L, item(2L, "FOOD-MRE", "自热应急口粮", "FOOD", "箱", 80));
    supplyItems.put(3L, item(3L, "MED-KIT01", "急救包（基础型）", "MEDICAL", "件", 60));
    supplyItems.put(4L, item(4L, "SHL-TENT", "12 ㎡棉帐篷", "SHELTER", "顶", 20));
    supplyItems.put(5L, item(5L, "TOOL-GEN", "5kW 汽油发电机", "RESCUE_TOOL", "台", 5));
    supplyItems.put(6L, item(6L, "MED-MASK", "医用防护口罩", "MEDICAL", "箱", 40));
  }

  private SupplyItem item(long id, String sku, String name, String category, String unit, int safety) {
    SupplyItem s = new SupplyItem();
    s.id = id; s.sku_code = sku; s.name = name; s.category = category; s.unit = unit;
    s.safety_stock = safety; s.expire_days = 365; s.storage_requirement = "常温";
    return s;
  }

  private void batch(long id, long whId, long itemId, String no, int remaining, int expireDays,
                     String source, String quality) {
    InventoryBatch b = new InventoryBatch();
    b.id = id; b.warehouse_id = whId; b.supply_item_id = itemId; b.batch_no = no;
    b.quantity = remaining; b.remaining_quantity = remaining;
    b.expire_at = at(expireDays); b.inbound_source = source; b.quality_status = quality;
    batches.put(id, b);
  }

  private void seedBatches() {
    batch(1L, 1, 1, "W1-WATER-2406", 40, 12, "市应急局季度配发", "NEAR_EXPIRY");
    batch(2L, 1, 1, "W1-WATER-2509", 200, 300, "市级储备轮换", "QUALIFIED");
    batch(3L, 1, 2, "W1-FOOD-2405", 30, 8, "社会捐赠（临期）", "NEAR_EXPIRY");
    batch(4L, 1, 2, "W1-FOOD-2506", 150, 400, "定点采购", "QUALIFIED");
    batch(5L, 1, 3, "W1-MEDK-2501", 20, -20, "超期未轮换", "EXPIRED");
    batch(6L, 1, 3, "W1-MEDK-2508", 70, 500, "市卫健委配发", "QUALIFIED");
    batch(7L, 1, 4, "W1-TENT-2401", 25, 900, "省厅调拨", "QUALIFIED");
    batch(8L, 1, 5, "W1-GEN-2302", 6, 1500, "省厅调拨", "QUALIFIED");
    batch(9L, 1, 6, "W1-MASK-2404", 50, -5, "防汛物资退库", "EXPIRED");
    batch(10L, 2, 1, "W2-WATER-2501", 90, 25, "区级配发", "NEAR_EXPIRY");
    batch(11L, 2, 1, "W2-WATER-2507", 120, 260, "区级配发", "QUALIFIED");
    batch(12L, 2, 2, "W2-FOOD-2503", 55, 360, "定点采购", "QUALIFIED");
    batch(13L, 2, 4, "W2-TENT-2309", 10, 20, "应急退库物资", "NEAR_EXPIRY");
    batch(14L, 2, 5, "W2-GEN-2401", 4, 1200, "区级配发", "QUALIFIED");
    batch(15L, 3, 1, "W3-WATER-2505", 60, 180, "区级配发", "QUALIFIED");
    batch(16L, 3, 4, "W3-TENT-2406", 8, 600, "区民政局调拨", "QUALIFIED");
  }

  private void seedShelters() {
    shelters.put(1L, shelter(1L, "望江社区避难点", "江东区", 500, 320, "陈主任", "HIGH", "OPEN"));
    shelters.put(2L, shelter(2L, "长河街道文体中心", "滨江区", 800, 120, "孙干事", "MEDIUM", "STANDBY"));
    shelters.put(3L, shelter(3L, "灵隐街道安置点", "西湖区", 300, 0, "周站长", "LOW", "CLOSED"));
    shelters.put(4L, shelter(4L, "东站枢纽应急安置区", "江干区", 1000, 980, "吴指挥", "CRITICAL", "FULL"));
  }

  private Shelter shelter(long id, String name, String district, int cap, int pop, String person,
                          String risk, String status) {
    Shelter s = new Shelter();
    s.id = id; s.name = name; s.district = district; s.capacity = cap; s.current_population = pop;
    s.contact_person = person; s.contact_phone = "1390000" + String.format("%4d", id).replace(' ', '0');
    s.risk_level = risk; s.open_status = status;
    return s;
  }

  private DispatchLine line(long id, long itemId, int qty, int available, int safety, int post,
                            boolean below) {
    DispatchLine l = new DispatchLine();
    l.id = id; l.supply_item_id = itemId; l.quantity = qty; l.available_quantity = available;
    l.gap_quantity = Math.max(0, qty - available); l.safety_stock = safety;
    l.post_remaining = post; l.below_safety_after = below;
    return l;
  }

  private TimelineEntry entry(String action, String actor, String note, String when) {
    TimelineEntry t = new TimelineEntry();
    t.id = ++timelineSeq; t.action = action; t.actor = actor; t.note = note; t.created_at = when;
    return t;
  }

  private DispatchOrderAggregate order(long id, String no, String event, long whId, long shelterId,
                                       String priority, String status, String requester,
                                       String approver, String createdAt, List<DispatchLine> lines,
                                       List<TimelineEntry> entries, List<String> warnings,
                                       String forceReason) {
    DispatchOrderAggregate o = new DispatchOrderAggregate();
    o.id = id; o.order_no = no; o.event_id = id; o.event_name = event;
    o.source_warehouse_id = whId; o.shelter_id = shelterId;
    o.priority = priority; o.status = status;
    o.requested_by = requester; o.approved_by = approver;
    o.created_at = createdAt;
    o.lines = lines; o.timeline = entries;
    o.warning_reasons = warnings; o.force_reason = forceReason == null ? "" : forceReason;
    return o;
  }

  private void seedDispatchOrders() {
    // 1. 待审批：水 160（临期 40 + 正常 120，出库后 80 < 安全 100）
    List<DispatchLine> lines1 = List.of(line(1, 1, 160, 240, 100, 80, true), line(2, 2, 30, 180, 80, 150, false));
    List<TimelineEntry> tl1 = List.of(entry("SUBMIT", "陈主任（望江社区）", "避难点提交物资申请：瓶装水 160 箱、自热口粮 30 箱", ago(1)));
    dispatchOrders.put(1L, order(1L, "DB-20260925-001", "望江路段内涝", 1, 1, "URGENT", "SUBMITTED",
        "陈主任（望江社区）", "", ago(1), lines1, new ArrayList<>(tl1), List.of(), ""));

    // 2. 待审批：口罩只有过期批，缺口 40
    List<DispatchLine> lines2 = new ArrayList<>();
    DispatchLine mask = line(3, 6, 40, 0, 40, 0, true);
    mask.excluded_expired_quantity = 50;
    lines2.add(mask);
    lines2.add(line(4, 3, 10, 70, 60, 60, false));
    List<TimelineEntry> tl2 = new ArrayList<>(List.of(
        entry("SUBMIT", "吴指挥（东站安置区）", "避难点提交物资申请：医用口罩 40 箱、急救包 10 件", ago(1)),
        entry("CHECK", "系统", "审批校验：医用防护口罩可用批次库存为 0（批次 W1-MASK-2404 已过期 50 箱，不可出库），缺口 40 箱，单据保持待审批", ago(0))));
    DispatchOrderAggregate o2 = order(2L, "DB-20260925-002", "东站枢纽大客流安置", 1, 4, "HIGH", "SUBMITTED",
        "吴指挥（东站安置区）", "", ago(1), lines2, tl2, List.of(), "");
    o2.blocking_reasons.add("物资「医用防护口罩」批次库存不足，缺口 40 箱（已过期批次 50 箱不可用），单据保持待审批");
    dispatchOrders.put(2L, o2);

    // 3. 待审批：来源仓库停用
    List<TimelineEntry> tl3 = new ArrayList<>(List.of(
        entry("SUBMIT", "周站长（灵隐安置点）", "避难点提交物资申请：瓶装水 20 箱", ago(2)),
        entry("CHECK", "系统", "审批校验：来源仓库「西湖临时周转仓」已停用，单据保持待审批", ago(0))));
    DispatchOrderAggregate o3 = order(3L, "DB-20260925-003", "灵隐片区临时安置", 3, 3, "NORMAL", "SUBMITTED",
        "周站长（灵隐安置点）", "", ago(2), List.of(line(5, 1, 20, 0, 100, 0, true)), tl3, List.of(), "");
    o3.blocking_reasons.add("来源仓库「西湖临时周转仓」已停用：库房消防整改，2026-09-20 起暂停一切调拨，预计停用 15 天");
    dispatchOrders.put(3L, o3);

    // 4. 已批准待出库（滨江 FEFO：临期水 50 + 正常水 20；临期帐篷 10 顶低于安全库存）
    // 冻结中的分配只展示、不扣减批次剩余量
    List<DispatchLine> lines4 = new ArrayList<>(List.of(
        line(6, 1, 70, 210, 100, 140, false),
        line(7, 4, 10, 10, 20, 0, true)));
    lines4.get(0).allocations = List.of(
        allocation(10L, "W2-WATER-2501", at(25), 50, 90, "NEAR_EXPIRY"),
        allocation(11L, "W2-WATER-2507", at(260), 20, 120, "QUALIFIED"));
    lines4.get(1).allocations = List.of(
        allocation(13L, "W2-TENT-2309", at(20), 10, 10, "NEAR_EXPIRY"));
    List<TimelineEntry> tl4 = new ArrayList<>(List.of(
        entry("SUBMIT", "孙干事（长河街道）", "避难点提交物资申请：瓶装水 70 箱、棉帐篷 10 顶", ago(2)),
        entry("APPROVE", "林审批",
            "审批通过，按到期先后冻结批次：W2-WATER-2501（临期）50 箱 → W2-WATER-2507 20 箱；W2-TENT-2309 10 顶", ago(1))));
    DispatchOrderAggregate o4 = order(4L, "DB-20260924-010", "长河街道防汛预置", 2, 2, "HIGH", "APPROVED",
        "孙干事（长河街道）", "林审批", ago(2), lines4, tl4,
        List.of("物资「12 ㎡棉帐篷」出库后库存 0 顶将低于安全库存 20 顶"),
        "防汛响应二级，长河街道预置点急需帐篷 10 顶，经区应急局同意先行调拨，48 小时内由市级储备补库");
    o4.approved_at = ago(1);
    dispatchOrders.put(4L, o4);

    // 5/6 为已完成的历史单据：先构造（用扣减前剩余量做快照），最后统一扣减批次库存。
    // 只动用帐篷/发电机批，不影响 1/2/3 号待审单的水、口粮、口罩 FEFO 演示。
    List<DispatchLine> lines5 = new ArrayList<>(List.of(
        line(8, 5, 2, 6, 5, 4, true),
        line(9, 4, 3, 25, 20, 22, false)));
    lines5.get(0).allocations = List.of(allocation(8L, "W1-GEN-2302", at(1500), 2, 6, "QUALIFIED"));
    lines5.get(1).allocations = List.of(allocation(7L, "W1-TENT-2401", at(900), 3, 25, "QUALIFIED"));
    List<TimelineEntry> tl5 = new ArrayList<>(List.of(
        entry("SUBMIT", "陈主任（望江社区）", "避难点提交物资申请：发电机 2 台、棉帐篷 3 顶", ago(3)),
        entry("APPROVE", "林审批", "审批通过，按到期先后冻结批次：W1-GEN-2302 2 台；W1-TENT-2401 3 顶", ago(2)),
        entry("DISPATCH", "王仓库（城东中心仓）", "仓库按 FEFO 批次出库：发电机 2 台、棉帐篷 3 顶，车辆 浙A·0001应急 已发往望江社区", ago(1))));
    DispatchOrderAggregate o5 = order(5L, "DB-20260923-007", "望江路段内涝", 1, 1, "NORMAL", "DISPATCHED",
        "陈主任（望江社区）", "林审批", ago(3), lines5, tl5,
        List.of("物资「5kW 汽油发电机」出库后库存 4 台将低于安全库存 5 台"),
        "内涝排涝必须保障临时供电，经值班领导电话批准先发，次日补采购单");
    o5.approved_at = ago(2);
    o5.dispatched_at = ago(1);
    dispatchOrders.put(5L, o5);

    List<DispatchLine> lines6 = new ArrayList<>(List.of(
        line(10, 4, 5, 22, 20, 17, true),
        line(11, 5, 1, 4, 5, 3, true)));
    lines6.get(0).allocations = List.of(
        allocation(7L, "W1-TENT-2401", at(900), 5, 22, "QUALIFIED"));
    lines6.get(1).allocations = List.of(
        allocation(8L, "W1-GEN-2302", at(1500), 1, 4, "QUALIFIED"));
    List<TimelineEntry> tl6 = new ArrayList<>(List.of(
        entry("SUBMIT", "吴指挥（东站安置区）", "避难点提交物资申请：棉帐篷 5 顶、发电机 1 台", ago(6)),
        entry("APPROVE", "林审批", "审批通过，按到期先后冻结批次：W1-TENT-2401 5 顶；W1-GEN-2302 1 台", ago(5)),
        entry("DISPATCH", "王仓库（城东中心仓）", "仓库按 FEFO 批次出库", ago(5)),
        entry("RECEIVE", "吴指挥（东站安置区）", "物资清点无误已签收：棉帐篷 5 顶、发电机 1 台", ago(4))));
    DispatchOrderAggregate o6 = order(6L, "DB-20260920-003", "9·20 城区短时强降雨", 1, 4, "URGENT", "RECEIVED",
        "吴指挥（东站安置区）", "林审批", ago(6), lines6, tl6,
        List.of(
            "物资「12 ㎡棉帐篷」出库后库存 17 顶将低于安全库存 20 顶",
            "物资「5kW 汽油发电机」出库后库存 3 台将低于安全库存 5 台"),
        "强降雨安置区应急供电与安置，经区应急局同意先发并限期补库");
    o6.approved_at = ago(5);
    o6.dispatched_at = ago(5);
    o6.received_at = ago(4);
    o6.received_by = "吴指挥（东站安置区）";
    o6.receive_note = "物资清点无误已签收";
    dispatchOrders.put(6L, o6);

    // 历史单据实际扣减后的当前批次剩余量（快照 remaining_before 保留扣减前数量）
    batches.get(7L).remaining_quantity = 17;  // 城东帐篷 25 - 3(单5) - 5(单6)
    batches.get(8L).remaining_quantity = 3;   // 城东发电机 6 - 2(单5) - 1(单6)
  }

  /** FEFO 批次分配快照：remaining_before 为批准/出库前剩余量 */
  private BatchAllocation allocation(long batchId, String batchNo, String expireAt,
                                     int allocate, int remainingBefore, String quality) {
    BatchAllocation a = new BatchAllocation();
    a.batch_id = batchId;
    a.batch_no = batchNo;
    a.expire_at = expireAt;
    a.allocate_quantity = allocate;
    a.remaining_before = remainingBefore;
    a.remaining_after = remainingBefore - allocate;
    a.quality_status = quality;
    a.near_expiry = "NEAR_EXPIRY".equals(quality);
    return a;
  }
}
