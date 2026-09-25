package com.generated.rescueStock.models;

public class InventoryBatch {
  public Long id;
  public Long warehouse_id;
  public Long supply_item_id;
  public String batch_no;
  public Integer quantity;
  public Integer remaining_quantity;
  public String expire_at;
  public String inbound_source;
  public String quality_status; // QUALIFIED / NEAR_EXPIRY / EXPIRED / QUARANTINED
}
