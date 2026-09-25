package com.generated.rescueStock.repositories;

import com.generated.rescueStock.models.InventoryBatch;
import java.util.List;
import org.springframework.stereotype.Repository;

@Repository
public class InventoryBatchRepository {
  private final InMemoryDataRepository data;

  public InventoryBatchRepository(InMemoryDataRepository data) {
    this.data = data;
  }

  public List<InventoryBatch> findAll() {
    return data.batches;
  }
}
