package com.generated.rescueStock.services;

import java.util.List;
import org.springframework.stereotype.Service;
import com.generated.rescueStock.models.Warehouse;
import com.generated.rescueStock.repositories.WarehouseRepository;

@Service
public class WarehouseService {
  private final WarehouseRepository repo;

  public WarehouseService(WarehouseRepository repo) {
    this.repo = repo;
  }

  public List<Warehouse> list() {
    return repo.findAll();
  }
}
