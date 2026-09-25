package com.generated.rescueStock.models;

import java.util.*;

/** 调拨单行：申请数量 + 批准时冻结的 FEFO 批次分配快照 */
public class DispatchLine {
  public Long id;
  public Long supply_item_id;
  public int quantity;
  public int available_quantity;
  public int gap_quantity;
  public int excluded_expired_quantity;
  public int excluded_quarantined_quantity;
  public int safety_stock;
  public int post_remaining;
  public boolean below_safety_after;
  public List<BatchAllocation> allocations = new ArrayList<>();
}
