package com.generated.rescueStock.constructors;

import com.generated.rescueStock.models.DispatchOrder;
import java.util.LinkedHashMap;
import java.util.Map;

/** 调拨单响应构造器：controller 不直接散写响应结构，统一从这里出。 */
public final class DispatchOrderDtoFactory {

  private DispatchOrderDtoFactory() {}

  public static Map<String, Object> summary(DispatchOrder order) {
    Map<String, Object> dto = new LinkedHashMap<>();
    dto.put("id", order.id);
    dto.put("order_no", order.orderNo);
    dto.put("source_warehouse_id", order.sourceWarehouseId);
    dto.put("source_warehouse_name", order.sourceWarehouseName);
    dto.put("shelter_id", order.shelterId);
    dto.put("shelter_name", order.shelterName);
    dto.put("status", order.status.name());
    dto.put("progress_size", order.progress.size());
    dto.put("latest_remark", order.progress.isEmpty() ? "" : order.progress.get(order.progress.size() - 1).remark);
    return dto;
  }
}
