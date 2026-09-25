package com.generated.rescueStock.services;

import java.util.*;
import org.springframework.stereotype.Service;
import com.generated.rescueStock.models.Warehouse;
import com.generated.rescueStock.repositories.WarehouseRepository;

@Service
public class WarehouseService {
  private final WarehouseRepository repo;
  public WarehouseService(WarehouseRepository repo) { this.repo = repo; }
  public List<Warehouse> list() { return repo.findAll(); }
  public Warehouse toggleStatus(long id, String reason) {
    Warehouse w = repo.findById(id).orElseThrow(() -> new WorkflowException("VALIDATION_FAILED", "仓库不存在：" + id));
    if ("ACTIVE".equals(w.status)) {
      if (reason == null || reason.trim().length() < 4) {
        throw new WorkflowException("VALIDATION_FAILED", "停用仓库时必须填写原因");
      }
      w.status = "DISABLED";
      w.disabled_reason = reason.trim();
    } else {
      w.status = "ACTIVE";
      w.disabled_reason = "";
    }
    return repo.save(w);
  }
}
