package com.generated.rescueStock.repositories;

import com.generated.rescueStock.models.Warehouse;
import java.util.List;
import org.springframework.stereotype.Repository;

@Repository
public class WarehouseRepository {
  private final InMemoryDataRepository data;

  public WarehouseRepository(InMemoryDataRepository data) {
    this.data = data;
  }

  public List<Warehouse> findAll() {
    return data.warehouses;
  }
}
