package com.generated.rescueStock.repositories;

import java.util.*;
import org.springframework.stereotype.Repository;
import com.generated.rescueStock.models.DispatchOrderAggregate;

@Repository
public class DispatchOrderRepository {
  private final InMemoryDatabase db;
  public DispatchOrderRepository(InMemoryDatabase db) { this.db = db; }
  public List<DispatchOrderAggregate> findAll() { return new ArrayList<>(db.dispatchOrders.values()); }
  public Optional<DispatchOrderAggregate> findById(long id) { return Optional.ofNullable(db.dispatchOrders.get(id)); }
  public DispatchOrderAggregate save(DispatchOrderAggregate order) {
    db.dispatchOrders.put(order.id, order);
    return order;
  }
}
