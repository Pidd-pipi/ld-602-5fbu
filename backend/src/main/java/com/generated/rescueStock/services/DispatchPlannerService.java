package com.generated.rescueStock.services;

import com.generated.rescueStock.constants.DispatchRule;
import com.generated.rescueStock.constants.ErrorMessages;
import com.generated.rescueStock.models.DispatchOrder;
import com.generated.rescueStock.models.InventoryBatch;
import com.generated.rescueStock.models.SupplyItem;
import com.generated.rescueStock.models.Warehouse;
import com.generated.rescueStock.repositories.InMemoryDataRepository;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;

/**
 * 调拨批次试算（FEFO：First Expired First Out）。
 * 先出到期日最近的临期批次，不足再顺延后续批次；
 * 同时核算库存缺口、来源仓库停用、跌破安全库存等阻塞原因。
 */
@Service
public class DispatchPlannerService {

  public static final String LEVEL_ERROR = "ERROR";
  public static final String LEVEL_WARNING = "WARNING";

  public static class PlannedLine {
    public DispatchOrder.DispatchLine line;
    public SupplyItem item;
    public final List<DispatchOrder.BatchAllocation> allocations = new ArrayList<>();
    public int allocatedTotal;
    public DispatchOrder.LineGap gap;
  }

  public static class Plan {
    public Optional<Warehouse> warehouse = Optional.empty();
    public boolean warehouseDisabled;
    public final List<PlannedLine> lines = new ArrayList<>();
    public final List<DispatchOrder.LineGap> gaps = new ArrayList<>();
    public final List<DispatchOrder.BlockReason> blockReasons = new ArrayList<>();
    public boolean canApprove;
    public boolean requireSafetyReason;
  }

  public static boolean isAllocatable(InventoryBatch batch, Instant now) {
    boolean expired = batch.expireAt != null && Instant.parse(batch.expireAt).isBefore(now);
    return !DispatchRule.BATCH_EXPIRED.equals(batch.qualityStatus)
        && !DispatchRule.BATCH_DAMAGED.equals(batch.qualityStatus)
        && !expired;
  }

  public static boolean isNearExpire(String expireAt, Instant now) {
    if (expireAt == null) return false;
    long days = Duration.between(now, Instant.parse(expireAt)).toDays();
    return days >= 0 && days <= DispatchRule.NEAR_EXPIRE_DAYS;
  }

  public Plan buildPlan(InMemoryDataRepository repo, DispatchOrder order) {
    Instant now = Instant.now();
    Plan plan = new Plan();
    plan.warehouse = repo.findWarehouse(order.sourceWarehouseId);
    plan.warehouseDisabled = plan.warehouse.map(w -> DispatchRule.WAREHOUSE_DISABLED.equals(w.status)).orElse(true);

    if (plan.warehouseDisabled) {
      plan.blockReasons.add(reason(LEVEL_ERROR, "WAREHOUSE_DISABLED",
          String.format(ErrorMessages.DISPATCH_WAREHOUSE_DISABLED, plan.warehouse.map(w -> w.name).orElse("未知仓库"))));
    }

    for (DispatchOrder.DispatchLine line : order.lines) {
      Optional<SupplyItem> itemOpt = repo.findItem(line.supplyItemId);
      if (itemOpt.isEmpty()) continue;
      SupplyItem item = itemOpt.get();

      List<InventoryBatch> candidates = repo.batches.stream()
          .filter(batch -> !plan.warehouseDisabled
              && batch.warehouseId.equals(order.sourceWarehouseId)
              && batch.supplyItemId.equals(item.id)
              && batch.quantity > 0
              && isAllocatable(batch, now))
          .sorted(Comparator.comparing(b -> Instant.parse(b.expireAt)))
          .toList();

      int remaining = line.requestedQuantity;
      PlannedLine planned = new PlannedLine();
      planned.line = line;
      planned.item = item;
      for (InventoryBatch batch : candidates) {
        int take = Math.min(remaining, batch.quantity);
        remaining -= take;
        if (take <= 0) continue;
        DispatchOrder.BatchAllocation allocation = new DispatchOrder.BatchAllocation();
        allocation.batchId = batch.id;
        allocation.batchNo = batch.batchNo;
        allocation.expireAt = batch.expireAt;
        allocation.availableQuantity = batch.quantity;
        allocation.allocatedQuantity = take;
        allocation.nearExpire = isNearExpire(batch.expireAt, now);
        planned.allocations.add(allocation);
      }

      int available = planned.allocations.stream().mapToInt(a -> a.availableQuantity).sum();
      planned.allocatedTotal = line.requestedQuantity - remaining;

      if (remaining > 0 && !plan.warehouseDisabled) {
        DispatchOrder.LineGap gap = new DispatchOrder.LineGap();
        gap.supplyItemId = item.id;
        gap.supplyName = item.name;
        gap.unit = item.unit;
        gap.requestedQuantity = line.requestedQuantity;
        gap.availableQuantity = available;
        gap.shortageQuantity = remaining;
        planned.gap = gap;
        plan.gaps.add(gap);
        plan.blockReasons.add(reason(LEVEL_ERROR, "STOCK_SHORTAGE",
            String.format(ErrorMessages.DISPATCH_STOCK_SHORTAGE, item.name, remaining, item.unit)));
      }
      plan.lines.add(planned);
    }

    if (!plan.warehouseDisabled) {
      for (PlannedLine planned : plan.lines) {
        if (planned.gap != null) continue;
        SupplyItem item = planned.item;
        int stockNow = repo.batches.stream()
            .filter(batch -> batch.warehouseId.equals(order.sourceWarehouseId)
                && batch.supplyItemId.equals(item.id)
                && isAllocatable(batch, now))
            .mapToInt(batch -> batch.quantity).sum();
        int remain = stockNow - planned.allocatedTotal;
        if (remain < item.safetyStock) {
          plan.blockReasons.add(reason(LEVEL_WARNING, "BELOW_SAFETY_STOCK",
              String.format(ErrorMessages.DISPATCH_BELOW_SAFETY,
                  plan.warehouse.map(w -> w.name).orElse("未知仓库"),
                  item.name, remain, item.unit, item.safetyStock, item.unit)));
        }
      }
    }

    boolean hasError = plan.blockReasons.stream().anyMatch(reason -> LEVEL_ERROR.equals(reason.level));
    plan.canApprove = !hasError;
    plan.requireSafetyReason = plan.blockReasons.stream().anyMatch(reason -> "BELOW_SAFETY_STOCK".equals(reason.code));
    return plan;
  }

  private DispatchOrder.BlockReason reason(String level, String code, String message) {
    DispatchOrder.BlockReason reason = new DispatchOrder.BlockReason();
    reason.level = level;
    reason.code = code;
    reason.message = message;
    return reason;
  }
}
