package com.generated.rescueStock.repositories;

import java.util.*;
import org.springframework.stereotype.Repository;
import com.generated.rescueStock.models.Warehouse;

@Repository
public class WarehouseRepository {
  private final InMemoryDatabase db;
  public WarehouseRepository(InMemoryDatabase db) { this.db = db; }
  public List<Warehouse> findAll() { return new ArrayList<>(db.warehouses.values()); }
  public Optional<Warehouse> findById(long id) { return Optional.ofNullable(db.warehouses.get(id)); }
  public Warehouse save(Warehouse w) { db.warehouses.put(w.id, w); return w; }
}
