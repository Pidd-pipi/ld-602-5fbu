package com.generated.rescueStock.models;

/** 应急仓库：ACTIVE 启用 / DISABLED 停用（停用后不能作为调拨来源） */
public class Warehouse {
  public Long id;
  public String name;
  public String district;
  public String address;
  public Long managerId;
  public Integer capacityLevel;
  public String contactPhone;
  public String status;
}
