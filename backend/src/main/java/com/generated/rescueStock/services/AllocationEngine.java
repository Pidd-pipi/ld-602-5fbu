package com.generated.rescueStock.services;

import java.time.*;
import java.util.*;
import java.util.stream.*;
import org.springframework.stereotype.Service;
import com.generated.rescueStock.models.*;
import com.generated.rescueStock.repositories.InMemoryDatabase;

/**
 * FEFO 分配引擎与审批计划计算（与前端 allocationEngine 口径一致）：
 * 1) 先出临期批次、再出后续批次（到期日升序，同日临期优先）；
 * 2) 过期/隔离批次不参与分配，但计入“被排除数量”用于缺口说明；
 * 3) 仓库停用 / 库存缺口为硬拦截；出库后低于安全库存为软预警（批准需原因）。
 */
@Service
public class AllocationEngine {

  private final InMemoryDatabase db;

  public AllocationEngine(InMemoryDatabase db) {
    this.db = db;
  }

  public boolean allocatable(InventoryBatch b) {
    return ("QUALIFIED".equals(b.quality_status) || "NEAR_EXPIRY".equals(b.quality_status))
        && b.remaining_quantity != null && b.remaining_quantity > 0;
  }

  public List<InventoryBatch> fefoSort(List<InventoryBatch> list) {
    return list.stream().sorted((a, b) -> {
      int byExpire = a.expire_at.compareTo(b.expire_at);
      if (byExpire != 0) return byExpire;
      if ("NEAR_EXPIRY".equals(a.quality_status) && !"NEAR_EXPIRY".equals(b.quality_status)) return -1;
      if (!"NEAR_EXPIRY".equals(a.quality_status) && "NEAR_EXPIRY".equals(b.quality_status)) return 1;
      return a.batch_no.compareTo(b.batch_no);
    }).collect(Collectors.toList());
  }

  public static boolean nearExpiry(String expireAtIso) {
    try {
      Instant expire = Instant.parse(expireAtIso);
      long days = Duration.between(Instant.now(), expire).toDays();
      return days >= 0 && days <= 30;
    } catch (Exception ex) {
      return false;
    }
  }

  /** 计算单行 FEFO 分配计划 */
  public LinePlan buildLinePlan(Long supplyItemId, int requested, List<InventoryBatch> sourceBatches) {
    SupplyItem item = db.supplyItems.get(supplyItemId);
    int safety = item == null || item.safety_stock == null ? 0 : item.safety_stock;

    List<InventoryBatch> candidates = fefoSort(sourceBatches.stream()
        .filter(b -> Objects.equals(b.supply_item_id, supplyItemId) && allocatable(b))
        .collect(Collectors.toList()));
    int excludedExpired = sourceBatches.stream()
        .filter(b -> Objects.equals(b.supply_item_id, supplyItemId) && "EXPIRED".equals(b.quality_status))
        .mapToInt(b -> b.remaining_quantity).sum();
    int excludedQuarantined = sourceBatches.stream()
        .filter(b -> Objects.equals(b.supply_item_id, supplyItemId) && "QUARANTINED".equals(b.quality_status))
        .mapToInt(b -> b.remaining_quantity).sum();

    int available = candidates.stream().mapToInt(b -> b.remaining_quantity).sum();
    int gap = Math.max(0, requested - available);

    LinePlan plan = new LinePlan();
    plan.supply_item_id = supplyItemId;
    plan.requested_quantity = requested;
    plan.available_quantity = available;
    plan.gap_quantity = gap;
    plan.excluded_expired_quantity = excludedExpired;
    plan.excluded_quarantined_quantity = excludedQuarantined;

    int need = Math.min(requested, available);
    for (InventoryBatch b : candidates) {
      if (need <= 0) break;
      int take = Math.min(need, b.remaining_quantity);
      if (take <= 0) continue;
      BatchAllocation alloc = new BatchAllocation();
      alloc.batch_id = b.id;
      alloc.batch_no = b.batch_no;
      alloc.expire_at = b.expire_at;
      alloc.allocate_quantity = take;
      alloc.remaining_before = b.remaining_quantity;
      alloc.remaining_after = b.remaining_quantity - take;
      alloc.quality_status = b.quality_status;
      alloc.near_expiry = "NEAR_EXPIRY".equals(b.quality_status) || nearExpiry(b.expire_at);
      plan.allocations.add(alloc);
      need -= take;
    }

    int postRemaining = Math.max(0, available - requested);
    plan.safety_stock = safety;
    plan.post_remaining = postRemaining;
    plan.below_safety_after = postRemaining < safety;
    return plan;
  }

  /** 整单审批计划：硬拦截（停用/缺口）与软预警（低于安全库存）分开 */
  public ApprovalPlan buildPlan(DispatchOrderAggregate order) {
    ApprovalPlan plan = new ApprovalPlan();
    plan.order_id = order.id;
    plan.warehouse_id = order.source_warehouse_id;
    Warehouse wh = db.warehouses.get(order.source_warehouse_id);
    plan.warehouse_active = wh != null && "ACTIVE".equals(wh.status);

    if (wh == null) {
      plan.blocking_reasons.add("来源仓库不存在（id=" + order.source_warehouse_id + "），请重新选择");
    } else if (!plan.warehouse_active) {
      plan.blocking_reasons.add("来源仓库「" + wh.name + "」已停用"
          + (wh.disabled_reason != null && !wh.disabled_reason.isBlank() ? "：" + wh.disabled_reason : ""));
    }

    List<InventoryBatch> source = plan.warehouse_active
        ? db.batches.values().stream().filter(b -> Objects.equals(b.warehouse_id, order.source_warehouse_id)).collect(Collectors.toList())
        : List.of();

    for (DispatchLine line : order.lines) {
      LinePlan lp = buildLinePlan(line.supply_item_id, line.quantity, source);
      plan.line_plans.add(lp);
      if (!plan.warehouse_active) continue;

      SupplyItem item = db.supplyItems.get(line.supply_item_id);
      String name = item != null ? item.name : ("物资#" + line.supply_item_id);
      String unit = item != null && item.unit != null ? item.unit : "";
      if (plan.warehouse_active && lp.gap_quantity > 0) {
        StringBuilder reason = new StringBuilder("物资「" + name + "」批次库存不足，缺口 " + lp.gap_quantity + unit + "，单据保持待审批");
        List<String> excluded = new ArrayList<>();
        if (lp.excluded_expired_quantity > 0) excluded.add("已过期批次 " + lp.excluded_expired_quantity + unit + "不可用");
        if (lp.excluded_quarantined_quantity > 0) excluded.add("隔离冻结 " + lp.excluded_quarantined_quantity + unit + "不可用");
        if (!excluded.isEmpty()) reason.append("（").append(String.join("，", excluded)).append("）");
        plan.blocking_reasons.add(reason.toString());
      }
      if (lp.below_safety_after && lp.gap_quantity == 0) {
        plan.warning_reasons.add("物资「" + name + "」出库后库存 " + lp.post_remaining + unit
            + " 将低于安全库存 " + lp.safety_stock + unit + "，必须填写强制出库原因");
      }
    }

    plan.approvable = plan.blocking_reasons.isEmpty();
    plan.has_warning = !plan.warning_reasons.isEmpty();
    return plan;
  }
}
