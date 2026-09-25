package com.generated.rescueStock.constants;

/** 调拨审批业务规则常量 */
public final class DispatchRule {
  private DispatchRule() {}
  /** 30 天内到期视为临期批次，FEFO 时优先出库 */
  public static final int NEAR_EXPIRE_DAYS = 30;
  public static final String WAREHOUSE_ACTIVE = "ACTIVE";
  public static final String WAREHOUSE_DISABLED = "DISABLED";
  public static final String BATCH_QUALIFIED = "QUALIFIED";
  public static final String BATCH_NEAR_EXPIRE = "NEAR_EXPIRE";
  public static final String BATCH_EXPIRED = "EXPIRED";
  public static final String BATCH_DAMAGED = "DAMAGED";
}
