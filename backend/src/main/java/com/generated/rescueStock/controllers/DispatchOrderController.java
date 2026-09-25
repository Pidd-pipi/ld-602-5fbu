package com.generated.rescueStock.controllers;

import com.generated.rescueStock.models.DispatchOrder;
import com.generated.rescueStock.services.DispatchOrderService;
import com.generated.rescueStock.services.DispatchPlannerService;
import com.generated.rescueStock.services.DispatchWorkflowService;
import com.generated.rescueStock.types.DispatchActionRequest;
import com.generated.rescueStock.types.DispatchApproveRequest;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/** 调拨审批流：列表、详情试算、批准、出库、签收、驳回。 */
@RestController
@RequestMapping("/api/dispatch-order")
public class DispatchOrderController {

  private final DispatchOrderService service;
  private final DispatchWorkflowService workflow;

  public DispatchOrderController(DispatchOrderService service, DispatchWorkflowService workflow) {
    this.service = service;
    this.workflow = workflow;
  }

  /** 列表：每条单据都带 lines/gaps/progress，切换页面后仍能看到进度。 */
  @GetMapping
  public List<DispatchOrder> list() {
    return service.list();
  }

  /** 详情：来源仓库、物资、批次剩余量与到期日、缺口、时间线。 */
  @GetMapping("/{id}")
  public DispatchOrder detail(@PathVariable Long id) {
    return service.detail(id);
  }

  /** 审批试算：返回 FEFO 批次方案、缺口与阻塞原因，不修改任何数据。 */
  @GetMapping("/{id}/plan")
  public DispatchPlannerService.Plan plan(@PathVariable Long id) {
    return workflow.preview(id);
  }

  /**
   * 批准：库存不足/仓库停用 → 单据保持 SUBMITTED 并返回缺口；
   * 跌破安全库存 → 必须随请求提供 safetyReason 说明原因。
   */
  @PostMapping("/{id}/approve")
  public DispatchOrder approve(@PathVariable Long id, @RequestBody DispatchApproveRequest request) {
    return workflow.approve(id, request.actor(), request.safetyReason(), request.note());
  }

  /** 出库：按锁定方案扣减批次余量（临期批次先出）。 */
  @PostMapping("/{id}/dispatch")
  public DispatchOrder dispatch(@PathVariable Long id, @RequestBody DispatchActionRequest request) {
    return workflow.dispatch(id, request.actor());
  }

  /** 签收：避难点确认。 */
  @PostMapping("/{id}/receive")
  public DispatchOrder receive(@PathVariable Long id, @RequestBody DispatchActionRequest request) {
    return workflow.receive(id, request.actor(), request.remark());
  }

  /** 驳回：必须填写原因。 */
  @PostMapping("/{id}/reject")
  public DispatchOrder reject(@PathVariable Long id, @RequestBody DispatchActionRequest request) {
    return workflow.reject(id, request.actor(), request.reason());
  }
}
