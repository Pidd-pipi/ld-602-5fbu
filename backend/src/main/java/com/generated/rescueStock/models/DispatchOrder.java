package com.generated.rescueStock.models;

import com.generated.rescueStock.constants.DispatchStatus;
import java.util.ArrayList;
import java.util.List;

/** 调拨单：聚合明细、缺口、阻塞原因与审批/出库/签收时间线 */
public class DispatchOrder {
  public Long id;
  public String orderNo;
  public Long eventId;
  public String eventName;
  public Long sourceWarehouseId;
  public String sourceWarehouseName;
  public Long shelterId;
  public String shelterName;
  public String priority;
  public DispatchStatus status;
  public String requestedBy;
  public String requestedAt;
  public String approvedBy;
  public String approvedAt;
  public String dispatchedAt;
  public String receivedAt;
  /** 审批结论（缺口/安全库存/停用原因等都落在这里并同步时间线） */
  public String decisionNote = "";
  public List<DispatchLine> lines = new ArrayList<>();
  public List<LineGap> gaps = new ArrayList<>();
  public List<BlockReason> blockReasons = new ArrayList<>();
  public List<ProgressNode> progress = new ArrayList<>();

  /** 调拨明细行：申请数量 + 批准后锁定的 FEFO 批次分配 */
  public static class DispatchLine {
    public Long id;
    public Long supplyItemId;
    public String supplyName;
    public String skuCode;
    public String unit;
    public Integer requestedQuantity;
    public List<BatchAllocation> allocations = new ArrayList<>();
  }

  /** FEFO 批次分配（先临期后常规），批准时快照 */
  public static class BatchAllocation {
    public Long batchId;
    public String batchNo;
    public String expireAt;
    public Integer availableQuantity;
    public Integer allocatedQuantity;
    public boolean nearExpire;
  }

  /** 库存缺口 */
  public static class LineGap {
    public Long supplyItemId;
    public String supplyName;
    public String unit;
    public Integer requestedQuantity;
    public Integer availableQuantity;
    public Integer shortageQuantity;
  }

  /** 仓库停用(ERROR)/跌破安全库存(WARNING) 等阻塞原因 */
  public static class BlockReason {
    public String level;
    public String code;
    public String message;
  }

  /** 时间线节点：审批、出库、签收结果都留存在这里 */
  public static class ProgressNode {
    public DispatchStatus status;
    public String at;
    public String actor;
    public String remark;
  }
}
