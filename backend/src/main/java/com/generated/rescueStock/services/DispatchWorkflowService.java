package com.generated.rescueStock.services;

import com.generated.rescueStock.constants.DispatchRule;
import com.generated.rescueStock.constants.DispatchStatus;
import com.generated.rescueStock.constants.ErrorCodes;
import com.generated.rescueStock.constants.ErrorMessages;
import com.generated.rescueStock.constants.LogTemplates;
import com.generated.rescueStock.models.DispatchOrder;
import com.generated.rescueStock.models.InventoryBatch;
import com.generated.rescueStock.repositories.InMemoryDataRepository;
import java.time.Instant;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * 调拨审批流：批准(FEFO 锁批次) → 出库(扣减批次余量) → 签收(闭环)。
 * 库存不足/仓库停用时保持 SUBMITTED 并在单据上留存缺口与原因。
 */
@Service
public class DispatchWorkflowService {

  private static final Logger audit = LoggerFactory.getLogger("auditLog");

  private final InMemoryDataRepository repo;
  private final DispatchPlannerService planner;

  public DispatchWorkflowService(InMemoryDataRepository repo, DispatchPlannerService planner) {
    this.repo = repo;
    this.planner = planner;
  }

  public DispatchPlannerService.Plan preview(Long orderId) {
    return planner.buildPlan(repo, requireOrder(orderId));
  }

  /**
   * 批准。库存不足/仓库停用：保持待审，返回状态仍为 SUBMITTED 的单据；
   * 跌破安全库存：必须传 safetyReason 说明原因。
   */
  public DispatchOrder approve(Long orderId, String actor, String safetyReason, String note) {
    DispatchOrder order = requireOrder(orderId);
    if (order.status != DispatchStatus.SUBMITTED) {
      throw new DispatchFlowException(ErrorCodes.DISPATCH_STATUS_CONFLICT,
          String.format(ErrorMessages.DISPATCH_STATUS_CONFLICT, order.status, "批准"));
    }

    DispatchPlannerService.Plan plan = planner.buildPlan(repo, order);
    if (!plan.canApprove) {
      order.gaps = plan.gaps;
      order.blockReasons = plan.blockReasons;
      order.decisionNote = String.join("；", plan.blockReasons.stream().map(b -> b.message).toList());
      append(order, DispatchStatus.SUBMITTED, actor, "批准未通过，保持待审：" + order.decisionNote);
      audit.warn(LogTemplates.DISPATCH_PENDING_SHORTAGE, order.orderNo,
          plan.gaps.stream().map(g -> g.supplyName + " 缺 " + g.shortageQuantity + g.unit).reduce((a, b) -> a + "、" + b).orElse("无"));
      return order;
    }
    if (plan.requireSafetyReason && (safetyReason == null || safetyReason.isBlank())) {
      throw new DispatchFlowException(ErrorCodes.VALIDATION_FAILED, ErrorMessages.DISPATCH_SAFETY_REASON_REQUIRED);
    }

    order.lines.clear();
    for (DispatchPlannerService.PlannedLine planned : plan.lines) {
      DispatchOrder.DispatchLine line = new DispatchOrder.DispatchLine();
      line.id = planned.line.id;
      line.supplyItemId = planned.item.id;
      line.supplyName = planned.item.name;
      line.skuCode = planned.item.skuCode;
      line.unit = planned.item.unit;
      line.requestedQuantity = planned.line.requestedQuantity;
      line.allocations = planned.allocations;
      order.lines.add(line);
    }
    order.gaps = List.of();
    order.blockReasons = plan.blockReasons;
    order.status = DispatchStatus.APPROVED;
    order.approvedBy = actor;
    order.approvedAt = Instant.now().toString();

    StringBuilder decision = new StringBuilder(note != null && !note.isBlank() ? note.trim() : "已批准，按 FEFO 锁定批次方案。");
    if (safetyReason != null && !safetyReason.isBlank()) {
      decision.append("；低于安全库存放行原因：").append(safetyReason.trim());
    }
    order.decisionNote = decision.toString();
    append(order, DispatchStatus.APPROVED, actor, order.decisionNote);
    audit.info(LogTemplates.DISPATCH_APPROVED, order.orderNo, order.lines.size());
    return order;
  }

  /** 出库：按批准时锁定的批次方案实际扣减余量。 */
  public DispatchOrder dispatch(Long orderId, String actor) {
    DispatchOrder order = requireOrder(orderId);
    if (order.status != DispatchStatus.APPROVED) {
      throw new DispatchFlowException(ErrorCodes.DISPATCH_STATUS_CONFLICT,
          String.format(ErrorMessages.DISPATCH_STATUS_CONFLICT, order.status, "出库"));
    }
    for (DispatchOrder.DispatchLine line : order.lines) {
      for (DispatchOrder.BatchAllocation allocation : line.allocations) {
        InventoryBatch batch = repo.batches.stream().filter(b -> b.id.equals(allocation.batchId)).findFirst()
            .orElseThrow(() -> new DispatchFlowException(ErrorCodes.VALIDATION_FAILED, "批次 " + allocation.batchNo + " 不存在"));
        if (batch.quantity < allocation.allocatedQuantity) {
          throw new DispatchFlowException(ErrorCodes.DISPATCH_STOCK_SHORTAGE,
              "批次 " + allocation.batchNo + " 余量 " + batch.quantity + " 不足 " + allocation.allocatedQuantity + "，请重新审批");
        }
        batch.quantity -= allocation.allocatedQuantity;
        refreshQuality(batch);
        audit.info(LogTemplates.DISPATCH_BATCH_OUT, order.orderNo, allocation.batchNo, allocation.allocatedQuantity, line.unit);
      }
    }
    order.status = DispatchStatus.DISPATCHED;
    order.dispatchedAt = Instant.now().toString();
    order.decisionNote = "批次已按 FEFO 方案出库，等待避难点签收。";
    append(order, DispatchStatus.DISPATCHED, actor, "按批准的批次方案完成出库装车");
    return order;
  }

  /** 签收：避难点确认收货，流程闭环。 */
  public DispatchOrder receive(Long orderId, String actor, String remark) {
    DispatchOrder order = requireOrder(orderId);
    if (order.status != DispatchStatus.DISPATCHED) {
      throw new DispatchFlowException(ErrorCodes.DISPATCH_STATUS_CONFLICT,
          String.format(ErrorMessages.DISPATCH_STATUS_CONFLICT, order.status, "签收"));
    }
    order.status = DispatchStatus.RECEIVED;
    order.receivedAt = Instant.now().toString();
    order.decisionNote = remark != null && !remark.isBlank() ? remark.trim() : "避难点已签收，数量与批次核对无误。";
    append(order, DispatchStatus.RECEIVED, actor, order.decisionNote);
    audit.info(LogTemplates.DISPATCH_RECEIVED, order.orderNo, order.shelterName);
    return order;
  }

  public DispatchOrder reject(Long orderId, String actor, String reason) {
    DispatchOrder order = requireOrder(orderId);
    if (order.status != DispatchStatus.SUBMITTED) {
      throw new DispatchFlowException(ErrorCodes.DISPATCH_STATUS_CONFLICT,
          String.format(ErrorMessages.DISPATCH_STATUS_CONFLICT, order.status, "驳回"));
    }
    if (reason == null || reason.isBlank()) {
      throw new DispatchFlowException(ErrorCodes.VALIDATION_FAILED, ErrorMessages.DISPATCH_REJECT_REASON_REQUIRED);
    }
    order.status = DispatchStatus.REJECTED;
    order.decisionNote = reason.trim();
    append(order, DispatchStatus.REJECTED, actor, reason.trim());
    audit.warn(LogTemplates.DISPATCH_REJECTED, order.orderNo, reason.trim());
    return order;
  }

  private DispatchOrder requireOrder(Long id) {
    return repo.findOrder(id)
        .orElseThrow(() -> new DispatchFlowException(ErrorCodes.DISPATCH_NOT_FOUND, ErrorMessages.DISPATCH_NOT_FOUND));
  }

  private void append(DispatchOrder order, DispatchStatus status, String actor, String remark) {
    DispatchOrder.ProgressNode node = new DispatchOrder.ProgressNode();
    node.status = status;
    node.at = Instant.now().toString();
    node.actor = actor;
    node.remark = remark;
    order.progress.add(node);
  }

  private void refreshQuality(InventoryBatch batch) {
    if (DispatchRule.BATCH_QUALIFIED.equals(batch.qualityStatus)) {
      long days = java.time.Duration.between(Instant.now(), Instant.parse(batch.expireAt)).toDays();
      if (days < 0) batch.qualityStatus = DispatchRule.BATCH_EXPIRED;
      else if (days <= DispatchRule.NEAR_EXPIRE_DAYS) batch.qualityStatus = DispatchRule.BATCH_NEAR_EXPIRE;
    }
  }
}
