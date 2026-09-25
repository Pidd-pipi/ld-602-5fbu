package com.generated.rescueStock.services;

import java.util.*;
import org.springframework.stereotype.Service;
import com.generated.rescueStock.models.*;
import com.generated.rescueStock.repositories.*;

@Service
public class DispatchOrderService {
  private final DispatchOrderRepository repo;
  private final InMemoryDatabase db;
  private final AllocationEngine engine;

  public DispatchOrderService(DispatchOrderRepository repo, InMemoryDatabase db, AllocationEngine engine) {
    this.repo = repo;
    this.db = db;
    this.engine = engine;
  }

  public List<DispatchOrderAggregate> list() { return repo.findAll(); }

  public DispatchOrderAggregate create(long warehouseId, long shelterId, String eventName,
                                       String priority, String requester,
                                       List<Map<String, Object>> items) {
    if (items == null || items.isEmpty()) {
      throw new WorkflowException("EMPTY_DISPATCH_LINES", "请至少添加一条物资申请明细");
    }
    long id = db.dispatchOrders.keySet().stream().max(Long::compareTo).orElse(0L) + 1;
    long lineId = 1;
    DispatchOrderAggregate order = new DispatchOrderAggregate();
    order.id = id;
    order.order_no = "DB-" + java.time.LocalDate.now() + "-" + String.format("%03d", id);
    order.event_id = null;
    order.event_name = eventName == null || eventName.isBlank() ? "日常物资补充" : eventName;
    order.source_warehouse_id = warehouseId;
    order.shelter_id = shelterId;
    order.priority = priority == null ? "NORMAL" : priority;
    order.status = "SUBMITTED";
    order.requested_by = requester;
    order.created_at = java.time.Instant.now().toString();
    for (Map<String, Object> row : items) {
      DispatchLine line = new DispatchLine();
      line.id = lineId++;
      line.supply_item_id = Long.valueOf(String.valueOf(row.get("supply_item_id")));
      line.quantity = Integer.parseInt(String.valueOf(row.get("quantity")));
      SupplyItem item = db.supplyItems.get(line.supply_item_id);
      line.safety_stock = item == null ? 0 : item.safety_stock;
      order.lines.add(line);
    }
    TimelineEntry e = new TimelineEntry();
    e.id = ++db.timelineSeq;
    e.action = "SUBMIT";
    e.actor = requester;
    e.note = "避难点提交物资申请，共 " + order.lines.size() + " 类物资";
    e.created_at = order.created_at;
    order.timeline.add(e);
    return repo.save(order);
  }
}
