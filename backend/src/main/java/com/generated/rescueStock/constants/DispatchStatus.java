package com.generated.rescueStock.constants;

import java.util.List;

/** 调拨单状态：DRAFT 草稿 / SUBMITTED 待审批 / APPROVED 已批准 / DISPATCHED 已出库 / RECEIVED 已签收 / REJECTED 已驳回 */
public enum DispatchStatus {
  DRAFT, SUBMITTED, APPROVED, DISPATCHED, RECEIVED, REJECTED;

  public String text() {
    return switch (this) {
      case DRAFT -> "草稿";
      case SUBMITTED -> "待审批";
      case APPROVED -> "已批准";
      case DISPATCHED -> "已出库";
      case RECEIVED -> "已签收";
      case REJECTED -> "已驳回";
    };
  }

  /** 审批流正向顺序：申请→批准→出库→签收 */
  public static final List<DispatchStatus> FLOW_ORDER =
      List.of(SUBMITTED, APPROVED, DISPATCHED, RECEIVED);
}
