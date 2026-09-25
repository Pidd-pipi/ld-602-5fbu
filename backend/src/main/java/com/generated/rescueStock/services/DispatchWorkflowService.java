package com.generated.rescueStock.services;

import java.time.Instant;
import java.util.*;
import java.util.stream.*;
import org.springframework.stereotype.Service;
import com.generated.rescueStock.models.*;
import com.generated.rescueStock.repositories.InMemoryDatabase;

/**
 * 调拨审批流：批准（FEFO 冻结）/ 出库（扣减批次剩余量）/ 签收 / 驳回。
 * 与前端 dispatchWorkflow 保持同样的状态机与留痕规则。
 */
@Service
public class DispatchWorkflowService {

  private final InMemoryDatabase db;
  private final AllocationEngine engine;

  public DispatchWorkflowService(InMemoryDatabase db, AllocationEngine engine) {
    this.db = db;
    this.engine = engine;
  }

  private DispatchOrderAggregate require(long id) {
    DispatchOrderAggregate order = db.dispatchOrders.get(id);
    if (order == null) throw new WorkflowException("VALIDATION_FAILED", "调拨单不存在：" + id);
    return order;
  }

  private void assertStatus(DispatchOrderAggregate order, String expected) {
    if (!Objects.equals(order.status, expected)) {
      throw new WorkflowException("ORDER_STATUS_INVALID", "当前单据状态不允许执行该操作");
    }
  }

  private void timeline(DispatchOrderAggregate order, String action, String actor, String note) {
    TimelineEntry e = new TimelineEntry();
    e.id = ++db.timelineSeq;
    e.action = action;
    e.actor = actor;
    e.note = note;
    e.created_at = Instant.now().toString();
    order.timeline.add(e);
  }

  public ApprovalPlan preview(long id) {
    return engine.buildPlan(require(id));
  }

  public static class ApproveResponse {
    public DispatchOrderAggregate order;
    public ApprovalPlan plan;
    public boolean blocked;
  }

  /** 批准：硬拦截保持待审；软预警必须填原因；通过则按 FEFO 冻结批次 */
  public ApproveResponse approve(long id, String actor, String forceReason) {
    DispatchOrderAggregate order = require(id);
    assertStatus(order, "SUBMITTED");
    ApprovalPlan plan = engine.buildPlan(order);
    ApproveResponse response = new ApproveResponse();
    response.plan = plan;

    if (!plan.approvable) {
      order.blocking_reasons = new ArrayList<>(plan.blocking_reasons);
      order.warning_reasons = new ArrayList<>(plan.warning_reasons);
      mergePlanIntoLines(order, plan);
      timeline(order, "CHECK", "系统", "审批校验未通过，单据保持待审批：" + String.join("；", plan.blocking_reasons));
      response.order = order;
      response.blocked = true;
      return response;
    }
    if (plan.has_warning && (forceReason == null || forceReason.trim().length() < 5)) {
      throw new WorkflowException("FORCE_REASON_REQUIRED",
          "存在低于安全库存的物资，请先填写不少于 5 个字的原因再批准");
    }

    order.status = "APPROVED";
    order.approved_by = actor;
    order.approved_at = Instant.now().toString();
    order.blocking_reasons = new ArrayList<>();
    order.warning_reasons = new ArrayList<>(plan.warning_reasons);
    order.force_reason = plan.has_warning ? forceReason.trim() : "";
    mergePlanIntoLines(order, plan);
    timeline(order, "APPROVE", actor,
        "审批通过，按到期先后（临期优先）冻结批次。"
            + (plan.has_warning ? " 强制出库原因：" + order.force_reason : ""));
    response.order = order;
    response.blocked = false;
    return response;
  }

  private void mergePlanIntoLines(DispatchOrderAggregate order, ApprovalPlan plan) {
    for (DispatchLine line : order.lines) {
      LinePlan lp = plan.line_plans.stream()
          .filter(x -> Objects.equals(x.supply_item_id, line.supply_item_id)).findFirst().orElse(null);
      if (lp == null) continue;
      line.available_quantity = lp.available_quantity;
      line.gap_quantity = lp.gap_quantity;
      line.excluded_expired_quantity = lp.excluded_expired_quantity;
      line.excluded_quarantined_quantity = lp.excluded_quarantined_quantity;
      line.safety_stock = lp.safety_stock;
      line.post_remaining = lp.post_remaining;
      line.below_safety_after = lp.below_safety_after;
      line.allocations = new ArrayList<>(lp.allocations);
    }
  }

  /** 出库：按批准冻结的分配快照逐批扣减剩余量 */
  public DispatchOrderAggregate dispatch(long id, String actor, String vehicleNote) {
    DispatchOrderAggregate order = require(id);
    assertStatus(order, "APPROVED");
    Map<Long, Integer> totals = new LinkedHashMap<>();
    for (DispatchLine line : order.lines) {
      for (BatchAllocation alloc : line.allocations) {
        totals.merge(alloc.batch_id, alloc.allocate_quantity, Integer::sum);
      }
    }
    Set<Long> touched = new LinkedHashSet<>();
    for (Map.Entry<Long, Integer> entry : totals.entrySet()) {
      InventoryBatch batch = db.batches.get(entry.getKey());
      if (batch == null || batch.remaining_quantity < entry.getValue()) {
        throw new WorkflowException("INSUFFICIENT_BATCH_STOCK",
            "批次 " + (batch == null ? entry.getKey() : batch.batch_no) + " 剩余量已变化，库存不足，请退回重新审批");
      }
      batch.remaining_quantity -= entry.getValue();
      touched.add(batch.id);
    }
    order.status = "DISPATCHED";
    order.dispatched_at = Instant.now().toString();
    timeline(order, "DISPATCH", actor,
        "仓库按批准的 FEFO 顺序出库，已扣减 " + touched.size() + " 个批次库存。"
            + (vehicleNote != null && !vehicleNote.isBlank() ? " 运输信息：" + vehicleNote : ""));
    return order;
  }

  public DispatchOrderAggregate receive(long id, String actor, String note) {
    DispatchOrderAggregate order = require(id);
    assertStatus(order, "DISPATCHED");
    order.status = "RECEIVED";
    order.received_by = actor;
    order.received_at = Instant.now().toString();
    order.receive_note = note == null ? "" : note.trim();
    timeline(order, "RECEIVE", actor, "避难点签收确认。"
        + (note != null && !note.isBlank() ? " 签收备注：" + note.trim() : " 数量与批次核对无误。"));
    return order;
  }

  public DispatchOrderAggregate reject(long id, String actor, String reason) {
    DispatchOrderAggregate order = require(id);
    assertStatus(order, "SUBMITTED");
    if (reason == null || reason.trim().isEmpty()) {
      throw new WorkflowException("VALIDATION_FAILED", "驳回时必须填写原因");
    }
    order.status = "REJECTED";
    order.reject_reason = reason.trim();
    for (DispatchLine line : order.lines) line.allocations = new ArrayList<>();
    timeline(order, "REJECT", actor, "审批驳回：" + reason.trim());
    return order;
  }
}
