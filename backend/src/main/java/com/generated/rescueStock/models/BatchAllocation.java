package com.generated.rescueStock.models;

import java.util.*;

/**
 * 调拨领域模型（内存存储，JSON 字段与前端 TypeScript 类型对齐）。
 * 真实部署时可由 JPA/MyBatis 实体替换，结构保持一致。
 */
public class BatchAllocation {
  public Long batch_id;
  public String batch_no;
  public String expire_at;
  public int allocate_quantity;
  public int remaining_before;
  public int remaining_after;
  public String quality_status;
  public boolean near_expiry;
}
