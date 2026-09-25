package com.generated.rescueStock.models;

/**
 * 审批计划（FEFO 逐行分配结果）。
 * blocking = 仓库停用/库存缺口（不可批准）；warning = 出库后低于安全库存（需原因）。
 */
public class LinePlan {
  public Long supply_item_id;
  public int requested_quantity;
  public int available_quantity;
  public int gap_quantity;
  public int excluded_expired_quantity;
  public int excluded_quarantined_quantity;
  public int safety_stock;
  public int post_remaining;
  public boolean below_safety_after;
  public java.util.List<BatchAllocation> allocations = new java.util.ArrayList<>();
}
