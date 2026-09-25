package com.generated.rescueStock.repositories;

import com.generated.rescueStock.constants.DispatchStatus;
import com.generated.rescueStock.models.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Repository;

/**
 * 进程内数据仓库 + 本地种子数据。
 * 生产环境替换为 MyBatis-Plus Mapper 后，service 层接口保持不变。
 * 注意：使用 @Component 而非 @Repository，避免被持久化异常翻译后处理器
 * 代理后公共字段（种子数据）访问不到。
 */
@org.springframework.stereotype.Component
public class InMemoryDataRepository {

  public final List<Warehouse> warehouses = new ArrayList<>();
  public final List<SupplyItem> supplyItems = new ArrayList<>();
  public final List<InventoryBatch> batches = new ArrayList<>();
  public final List<Shelter> shelters = new ArrayList<>();
  public final List<DispatchOrder> dispatchOrders = new ArrayList<>();

  public InMemoryDataRepository() {
    seed();
  }

  public Optional<DispatchOrder> findOrder(Long id) {
    return dispatchOrders.stream().filter(order -> order.id.equals(id)).findFirst();
  }

  public Optional<Warehouse> findWarehouse(Long id) {
    return warehouses.stream().filter(entry -> entry.id.equals(id)).findFirst();
  }

  public Optional<SupplyItem> findItem(Long id) {
    return supplyItems.stream().filter(entry -> entry.id.equals(id)).findFirst();
  }

  private void seed() {
    seedWarehouses();
    seedItems();
    seedBatches();
    seedShelters();
    seedOrders();
  }

  private void seedWarehouses() {
    warehouses.add(warehouse(1L, "江岸区中心应急仓", "江岸区", "武汉路 12 号", 3, "027-88000001", "ACTIVE"));
    warehouses.add(warehouse(2L, "汉阳区应急储备库", "汉阳区", "鹦鹉大道 57 号", 2, "027-88000002", "ACTIVE"));
    warehouses.add(warehouse(3L, "硚口区老物资仓库", "硚口区", "古田三路 9 号", 1, "027-88000003", "DISABLED"));
  }

  private Warehouse warehouse(long id, String name, String district, String address, int level, String phone, String status) {
    Warehouse entry = new Warehouse();
    entry.id = id;
    entry.name = name;
    entry.district = district;
    entry.address = address;
    entry.managerId = id;
    entry.capacityLevel = level;
    entry.contactPhone = phone;
    entry.status = status;
    return entry;
  }

  private void seedItems() {
    supplyItems.add(item(1L, "WATER-550ML", "瓶装饮用水 550ml", "WATER", "箱", 100, 720));
    supplyItems.add(item(2L, "FOOD-BISCUIT", "压缩干粮", "FOOD", "箱", 80, 540));
    supplyItems.add(item(3L, "MED-KIT-A", "医用急救包 A 型", "MEDICAL", "套", 30, 365));
    supplyItems.add(item(4L, "SHELTER-TENT-12", "12 平米折叠帐篷", "SHELTER", "顶", 20, 1825));
    supplyItems.add(item(5L, "TOOL-LIFE-VEST", "救生衣", "RESCUE_TOOL", "件", 50, 1095));
  }

  private SupplyItem item(long id, String sku, String name, String category, String unit, int safety, int expireDays) {
    SupplyItem entry = new SupplyItem();
    entry.id = id;
    entry.skuCode = sku;
    entry.name = name;
    entry.category = category;
    entry.unit = unit;
    entry.safetyStock = safety;
    entry.expireDays = expireDays;
    entry.storageRequirement = "按品类规范存储";
    return entry;
  }

  private void seedBatches() {
    batch(101L, 1L, 1L, "W2406-15", 120, "2026-10-10T09:00:00Z", "市级应急物资调拨", "NEAR_EXPIRE");
    batch(102L, 1L, 1L, "W2502-03", 200, "2027-04-01T09:00:00Z", "集中采购入库", "QUALIFIED");
    batch(103L, 1L, 2L, "F2405-22", 40, "2026-10-02T09:00:00Z", "社会捐赠", "NEAR_EXPIRE");
    batch(104L, 1L, 2L, "F2503-11", 100, "2027-05-01T09:00:00Z", "集中采购入库", "QUALIFIED");
    batch(105L, 1L, 3L, "M2401-08", 20, "2026-08-01T09:00:00Z", "区级轮换物资", "EXPIRED");
    batch(106L, 1L, 3L, "M2501-19", 25, "2027-01-10T09:00:00Z", "集中采购入库", "QUALIFIED");
    batch(107L, 1L, 4L, "T2408-30", 15, "2027-06-01T09:00:00Z", "市级应急物资调拨", "QUALIFIED");
    batch(201L, 2L, 1L, "W2501-42", 300, "2027-02-01T09:00:00Z", "集中采购入库", "QUALIFIED");
    batch(202L, 2L, 5L, "V2412-07", 60, "2027-03-01T09:00:00Z", "社会捐赠", "QUALIFIED");
    batch(301L, 3L, 1L, "W2309-51", 500, "2026-11-20T09:00:00Z", "历史储备", "NEAR_EXPIRE");
  }

  private void batch(long id, long warehouseId, long itemId, String no, int qty, String expire, String source, String quality) {
    InventoryBatch entry = new InventoryBatch();
    entry.id = id;
    entry.warehouseId = warehouseId;
    entry.supplyItemId = itemId;
    entry.batchNo = no;
    entry.quantity = qty;
    entry.expireAt = expire;
    entry.inboundSource = source;
    entry.qualityStatus = quality;
    this.batches.add(entry);
  }

  private void seedShelters() {
    shelters.add(shelter(1L, "江汉路街道避难点", "江岸区", 500, 320, "周敏", "HIGH", "OPEN"));
    shelters.add(shelter(2L, "鹦鹉洲社区安置点", "汉阳区", 300, 180, "李强", "MEDIUM", "OPEN"));
    shelters.add(shelter(3L, "古田街道临时安置点", "硚口区", 200, 0, "陈芳", "LOW", "STANDBY"));
  }

  private Shelter shelter(long id, String name, String district, int capacity, int population, String person, String risk, String open) {
    Shelter entry = new Shelter();
    entry.id = id;
    entry.name = name;
    entry.district = district;
    entry.capacity = capacity;
    entry.currentPopulation = population;
    entry.contactPerson = person;
    entry.riskLevel = risk;
    entry.openStatus = open;
    return entry;
  }

  private void seedOrders() {
    dispatchOrders.add(order(1L, "DB-20260924-001", 1L, "9·24 沿江强降雨内涝", 1L, 1L, "URGENT",
        "周敏（江汉路街道避难点）", "2026-09-24T20:15:00Z",
        lines(new long[][] {{11L, 1L, 150}, {12L, 2L, 120}}), DispatchStatus.SUBMITTED));
    dispatchOrders.add(order(2L, "DB-20260925-002", 1L, "9·24 沿江强降雨内涝", 1L, 1L, "HIGH",
        "周敏（江汉路街道避难点）", "2026-09-25T08:40:00Z",
        lines(new long[][] {{21L, 3L, 60}}), DispatchStatus.SUBMITTED));
    dispatchOrders.add(order(3L, "DB-20260925-003", 2L, "9·25 汉江北岸人员转移", 3L, 3L, "NORMAL",
        "陈芳（古田街道临时安置点）", "2026-09-25T09:05:00Z",
        lines(new long[][] {{31L, 1L, 80}}), DispatchStatus.SUBMITTED));

    DispatchOrder approved = order(4L, "DB-20260923-004", 3L, "9·23 鹦鹉洲积水排险", 2L, 2L, "HIGH",
        "李强（鹦鹉洲社区安置点）", "2026-09-23T14:20:00Z",
        lines(new long[][] {{41L, 1L, 80}}), DispatchStatus.APPROVED);
    approved.approvedBy = "调度员 王磊";
    approved.approvedAt = "2026-09-23T15:02:00Z";
    approved.decisionNote = "批次方案已确认，等待仓库出库。";
    approved.lines.get(0).allocations.add(allocation(201L, "W2501-42", "2027-02-01T09:00:00Z", 300, 80, false));
    approved.progress.add(node(DispatchStatus.APPROVED, "2026-09-23T15:02:00Z", "王磊", "批准并锁定 FEFO 批次方案"));
    dispatchOrders.add(approved);
  }

  private List<DispatchOrder.DispatchLine> lines(long[][] spec) {
    List<DispatchOrder.DispatchLine> result = new ArrayList<>();
    for (long[] row : spec) {
      DispatchOrder.DispatchLine line = new DispatchOrder.DispatchLine();
      line.id = row[0];
      line.supplyItemId = row[1];
      line.requestedQuantity = (int) row[2];
      result.add(line);
    }
    return result;
  }

  private DispatchOrder.BatchAllocation allocation(long batchId, String no, String expire, int available, int allocated, boolean near) {
    DispatchOrder.BatchAllocation allocation = new DispatchOrder.BatchAllocation();
    allocation.batchId = batchId;
    allocation.batchNo = no;
    allocation.expireAt = expire;
    allocation.availableQuantity = available;
    allocation.allocatedQuantity = allocated;
    allocation.nearExpire = near;
    return allocation;
  }

  private DispatchOrder order(long id, String no, long eventId, String eventName, long warehouseId, long shelterId,
      String priority, String requestedBy, String requestedAt, List<DispatchOrder.DispatchLine> lines, DispatchStatus status) {
    DispatchOrder entry = new DispatchOrder();
    entry.id = id;
    entry.orderNo = no;
    entry.eventId = eventId;
    entry.eventName = eventName;
    entry.sourceWarehouseId = warehouseId;
    entry.shelterId = shelterId;
    entry.priority = priority;
    entry.requestedBy = requestedBy;
    entry.requestedAt = requestedAt;
    entry.status = status;
    entry.lines = lines;
    entry.sourceWarehouseName = findWarehouse(warehouseId).map(w -> w.name).orElse("未知仓库");
    entry.shelterName = shelters.stream().filter(s -> s.id.equals(shelterId)).findFirst().map(s -> s.name).orElse("");
    for (DispatchOrder.DispatchLine line : entry.lines) {
      findItem(line.supplyItemId).ifPresent(item -> {
        line.supplyName = item.name;
        line.skuCode = item.skuCode;
        line.unit = item.unit;
      });
    }
    entry.progress.add(node(DispatchStatus.SUBMITTED, requestedAt, requestedBy.replaceAll("（.*）", ""), "避难点提交物资申请"));
    return entry;
  }

  private DispatchOrder.ProgressNode node(DispatchStatus status, String at, String actor, String remark) {
    DispatchOrder.ProgressNode node = new DispatchOrder.ProgressNode();
    node.status = status;
    node.at = at;
    node.actor = actor;
    node.remark = remark;
    return node;
  }

  public String nowIso() {
    return Instant.now().toString();
  }
}
