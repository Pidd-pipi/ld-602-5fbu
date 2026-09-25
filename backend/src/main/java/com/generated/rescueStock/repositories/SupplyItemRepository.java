package com.generated.rescueStock.repositories;

import com.generated.rescueStock.models.SupplyItem;
import java.util.List;
import org.springframework.stereotype.Repository;

@Repository
public class SupplyItemRepository {
  private final InMemoryDataRepository data;

  public SupplyItemRepository(InMemoryDataRepository data) {
    this.data = data;
  }

  public List<SupplyItem> findAll() {
    return data.supplyItems;
  }
}
