package com.generated.rescueStock.models;

/** 应急物资档案，safetyStock 为该物资在仓库层面的安全库存线 */
public class SupplyItem {
  public Long id;
  public String skuCode;
  public String name;
  public String category;
  public String unit;
  public Integer safetyStock;
  public Integer expireDays;
  public String storageRequirement;
}
