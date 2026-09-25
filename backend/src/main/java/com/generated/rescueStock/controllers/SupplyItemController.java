package com.generated.rescueStock.controllers;

import java.util.*;
import org.springframework.web.bind.annotation.*;
import com.generated.rescueStock.models.SupplyItem;
import com.generated.rescueStock.services.SupplyItemService;

@RestController
@RequestMapping("/api/supply-item")
public class SupplyItemController {
  private final SupplyItemService service;
  public SupplyItemController(SupplyItemService service) { this.service = service; }

  @GetMapping
  public List<SupplyItem> list() { return service.list(); }
}
