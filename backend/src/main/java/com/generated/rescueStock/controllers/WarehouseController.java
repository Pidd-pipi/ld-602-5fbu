package com.generated.rescueStock.controllers;

import java.util.*;
import org.springframework.web.bind.annotation.*;
import com.generated.rescueStock.models.Warehouse;
import com.generated.rescueStock.services.WarehouseService;

@RestController
@RequestMapping("/api/warehouse")
public class WarehouseController {
  private final WarehouseService service;
  public WarehouseController(WarehouseService service) { this.service = service; }

  @GetMapping
  public List<Warehouse> list() { return service.list(); }

  /** 仓库启停用：停用必须填原因，原因会进入调拨审批拦截说明 */
  @PostMapping("/{id}/toggle-status")
  public Warehouse toggleStatus(@PathVariable long id, @RequestBody Map<String, String> body) {
    return service.toggleStatus(id, body.get("reason"));
  }
}
