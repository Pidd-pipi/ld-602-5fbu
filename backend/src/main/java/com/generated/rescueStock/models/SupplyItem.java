package com.generated.rescueStock.models;

public class SupplyItem {
  public Long id;
  public String sku_code;
  public String name;
  public String category; // FOOD / WATER / MEDICAL / SHELTER / RESCUE_TOOL
  public String unit;
  public Integer safety_stock;
  public Integer expire_days;
  public String storage_requirement;
}
