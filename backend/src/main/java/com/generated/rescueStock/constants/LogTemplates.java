package com.generated.rescueStock.constants;

/** 调拨单写操作的日志模板，参数由 service 层填充；真实环境经审计中间件双写。 */
public final class LogTemplates {
  private LogTemplates() {}
  public static final String CREATE = "create";
  public static final String UPDATE = "update";
  public static final String STATUS = "status";
  public static final String EXPORT = "export";
  public static final String DISPATCH_SUBMITTED = "调拨单 %s 由避难点 %s 提交申请";
  public static final String DISPATCH_APPROVED = "调拨单 %s 批准通过，按 FEFO 分配 %d 项批次";
  public static final String DISPATCH_PENDING_SHORTAGE = "调拨单 %s 库存不足保持待审，缺口：%s";
  public static final String DISPATCH_BATCH_OUT = "调拨单 %s 批次 %s 出库 %d %s";
  public static final String DISPATCH_RECEIVED = "调拨单 %s 由 %s 签收确认";
  public static final String DISPATCH_REJECTED = "调拨单 %s 驳回：%s";
}
