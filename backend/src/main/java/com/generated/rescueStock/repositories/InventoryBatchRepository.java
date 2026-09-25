package com.generated.rescueStock.repositories;

import java.util.*;
import org.springframework.stereotype.Repository;
import com.generated.rescueStock.models.InventoryBatch;

@Repository
public class InventoryBatchRepository {
  private final InMemoryDatabase db;
  public InventoryBatchRepository(InMemoryDatabase db) { this.db = db; }
  public List<InventoryBatch> findAll() { return new ArrayList<>(db.batches.values()); }
  public List<InventoryBatch> findByWarehouse(long warehouseId) {
    List<InventoryBatch> list = new ArrayList<>();
    for (InventoryBatch b : db.batches.values()) {
      if (Objects.equals(b.warehouse_id, warehouseId)) list.add(b);
    }
    return list;
  }
  public Optional<InventoryBatch> findById(long id) { return Optional.ofNullable(db.batches.get(id)); }
}
