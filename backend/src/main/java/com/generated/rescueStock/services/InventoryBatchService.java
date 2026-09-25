package com.generated.rescueStock.services;

import java.util.List;
import org.springframework.stereotype.Service;
import com.generated.rescueStock.models.InventoryBatch;
import com.generated.rescueStock.repositories.InventoryBatchRepository;

@Service
public class InventoryBatchService {
  private final InventoryBatchRepository repo;

  public InventoryBatchService(InventoryBatchRepository repo) {
    this.repo = repo;
  }

  public List<InventoryBatch> list() {
    return repo.findAll();
  }
}
