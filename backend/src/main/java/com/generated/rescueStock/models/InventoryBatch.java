package com.generated.rescueStock.models;

/** 库存批次：quantity 为批次剩余量，expireAt 决定 FEFO 出库顺序 */
public class InventoryBatch {
  public Long id;
  public Long warehouseId;
  public Long supplyItemId;
  public String batchNo;
  public Integer quantity;
  public String expireAt;
  public String inboundSource;
  /** QUALIFIED / NEAR_EXPIRE / EXPIRED / DAMAGED */
  public String qualityStatus;
}
