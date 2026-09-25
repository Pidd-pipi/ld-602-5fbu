package com.generated.rescueStock.models;

import java.util.*;

/** 整单审批计划，供详情页与批准接口共用 */
public class ApprovalPlan {
  public Long order_id;
  public Long warehouse_id;
  public boolean warehouse_active;
  public boolean approvable;
  public boolean has_warning;
  public List<String> blocking_reasons = new ArrayList<>();
  public List<String> warning_reasons = new ArrayList<>();
  public List<LinePlan> line_plans = new ArrayList<>();
}
