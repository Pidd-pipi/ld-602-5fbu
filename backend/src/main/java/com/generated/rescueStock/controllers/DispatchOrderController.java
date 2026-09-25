package com.generated.rescueStock.controllers;

import java.util.*;
import org.springframework.web.bind.annotation.*;
import com.generated.rescueStock.models.*;
import com.generated.rescueStock.services.*;

/**
 * 调拨审批流接口：
 *  GET  /api/dispatch-order             列表（含时间线/缺口/批次冻结快照）
 *  GET  /api/dispatch-order/{id}/plan   审批预览（FEFO 计划、剩余量、到期日、缺口）
 *  POST /api/dispatch-order             避难点提交物资申请
 *  POST /api/dispatch-order/{id}/approve 批准（库存不足保持待审并列缺口；低于安全库存需 reason）
 *  POST /api/dispatch-order/{id}/reject  驳回（必须填原因）
 *  POST /api/dispatch-order/{id}/dispatch 出库（按 FEFO 冻结快照扣减批次）
 *  POST /api/dispatch-order/{id}/receive  签收
 */
@RestController
@RequestMapping("/api/dispatch-order")
public class DispatchOrderController {
  private final DispatchOrderService service;
  private final DispatchWorkflowService workflow;

  public DispatchOrderController(DispatchOrderService service, DispatchWorkflowService workflow) {
    this.service = service;
    this.workflow = workflow;
  }

  @GetMapping
  public List<DispatchOrderAggregate> list() { return service.list(); }

  @GetMapping("/{id}/plan")
  public ApprovalPlan plan(@PathVariable long id) { return workflow.preview(id); }

  @PostMapping
  @SuppressWarnings("unchecked")
  public DispatchOrderAggregate create(@RequestBody Map<String, Object> body) {
    Number wh = (Number) body.get("source_warehouse_id");
    Number shelter = (Number) body.get("shelter_id");
    return service.create(
        wh == null ? 0L : wh.longValue(),
        shelter == null ? 0L : shelter.longValue(),
        (String) body.get("event_name"),
        (String) body.getOrDefault("priority", "NORMAL"),
        (String) body.get("requested_by"),
        (List<Map<String, Object>>) body.get("items"));
  }

  @PostMapping("/{id}/approve")
  public DispatchWorkflowService.ApproveResponse approve(@PathVariable long id, @RequestBody Map<String, String> body) {
    return workflow.approve(id, body.getOrDefault("actor", "审批员"), body.get("force_reason"));
  }

  @PostMapping("/{id}/reject")
  public DispatchOrderAggregate reject(@PathVariable long id, @RequestBody Map<String, String> body) {
    return workflow.reject(id, body.getOrDefault("actor", "审批员"), body.get("reason"));
  }

  @PostMapping("/{id}/dispatch")
  public DispatchOrderAggregate dispatch(@PathVariable long id, @RequestBody Map<String, String> body) {
    return workflow.dispatch(id, body.getOrDefault("actor", "仓库员"), body.getOrDefault("vehicle_note", ""));
  }

  @PostMapping("/{id}/receive")
  public DispatchOrderAggregate receive(@PathVariable long id, @RequestBody Map<String, String> body) {
    return workflow.receive(id, body.getOrDefault("actor", "避难点"), body.getOrDefault("note", ""));
  }
}
