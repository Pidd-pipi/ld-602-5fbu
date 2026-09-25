package com.generated.rescueStock.services;

import java.util.List;
import org.springframework.stereotype.Service;
import com.generated.rescueStock.models.SupplyItem;
import com.generated.rescueStock.repositories.SupplyItemRepository;

@Service
public class SupplyItemService {
  private final SupplyItemRepository repo;

  public SupplyItemService(SupplyItemRepository repo) {
    this.repo = repo;
  }

  public List<SupplyItem> list() {
    return repo.findAll();
  }
}
