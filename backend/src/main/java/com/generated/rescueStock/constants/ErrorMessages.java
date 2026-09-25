package com.generated.rescueStock.constants;

public final class ErrorMessages {
  private ErrorMessages() {}
  public static final String AUTH_REQUIRED = "missing token";
  public static final String RBAC_DENIED = "role denied";
  public static final String DISPATCH_WAREHOUSE_DISABLED = "来源仓库「%s」已停用，无法调拨出库";
  public static final String DISPATCH_STOCK_SHORTAGE = "物资「%s」库存不足，缺口 %d %s，单据保持待审批";
  public static final String DISPATCH_BELOW_SAFETY = "按 FEFO 出库后，仓库「%s」物资「%s」余量 %d %s，低于安全库存 %d %s";
  public static final String DISPATCH_STATUS_CONFLICT = "当前状态为 %s，不能执行 %s";
  public static final String DISPATCH_NOT_FOUND = "调拨单不存在或已被处理";
  public static final String DISPATCH_SAFETY_REASON_REQUIRED = "出库将导致低于安全库存，请填写原因说明后再批准";
  public static final String DISPATCH_REJECT_REASON_REQUIRED = "驳回必须填写原因";
}
