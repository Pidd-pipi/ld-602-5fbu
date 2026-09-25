package com.generated.rescueStock.models;

/** 审批流转时间线条目 */
public class TimelineEntry {
  public Long id;
  public String action; // SUBMIT / CHECK / APPROVE / REJECT / DISPATCH / RECEIVE
  public String actor;
  public String note;
  public String created_at;
}
