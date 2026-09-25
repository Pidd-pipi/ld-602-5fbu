package com.generated.rescueStock.models;

import java.util.*;

/** 调拨单聚合：明细行 + 时间线 + 缺口/停用拦截原因 + 低于安全库存强制出库原因 */
public class DispatchOrderAggregate {
  public Long id;
  public String order_no;
  public Long event_id;
  public String event_name;
  public Long source_warehouse_id;
  public Long shelter_id;
  public String priority;
  public String status;
  public String requested_by;
  public String approved_by;
  public String received_by;
  public String created_at;
  public String approved_at;
  public String dispatched_at;
  public String received_at;
  public List<DispatchLine> lines = new ArrayList<>();
  public List<TimelineEntry> timeline = new ArrayList<>();
  public List<String> blocking_reasons = new ArrayList<>();
  public List<String> warning_reasons = new ArrayList<>();
  public String force_reason = "";
  public String reject_reason = "";
  public String receive_note = "";
}
