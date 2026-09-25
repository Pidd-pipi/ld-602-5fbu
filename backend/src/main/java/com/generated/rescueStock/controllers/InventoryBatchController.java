package com.generated.rescueStock.controllers;

import java.util.List;
import org.springframework.web.bind.annotation.*;
import com.generated.rescueStock.models.InventoryBatch;
import com.generated.rescueStock.services.InventoryBatchService;

@RestController
@RequestMapping("/api/inventory-batch")
public class InventoryBatchController {
  private final InventoryBatchService service;

  public InventoryBatchController(InventoryBatchService service) {
    this.service = service;
  }

  @GetMapping
  public List<InventoryBatch> list() {
    return service.list();
  }
}
