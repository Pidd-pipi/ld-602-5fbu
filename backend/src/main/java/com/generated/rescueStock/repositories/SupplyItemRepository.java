package com.generated.rescueStock.repositories;

import java.util.*;
import org.springframework.stereotype.Repository;
import com.generated.rescueStock.models.SupplyItem;

@Repository
public class SupplyItemRepository {
  private final InMemoryDatabase db;
  public SupplyItemRepository(InMemoryDatabase db) { this.db = db; }
  public List<SupplyItem> findAll() { return new ArrayList<>(db.supplyItems.values()); }
  public Optional<SupplyItem> findById(long id) { return Optional.ofNullable(db.supplyItems.get(id)); }
}
