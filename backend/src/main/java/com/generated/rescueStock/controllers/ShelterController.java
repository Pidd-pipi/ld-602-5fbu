package com.generated.rescueStock.controllers;

import java.util.List;
import org.springframework.web.bind.annotation.*;
import com.generated.rescueStock.models.Shelter;
import com.generated.rescueStock.services.ShelterService;

@RestController
@RequestMapping("/api/shelter")
public class ShelterController {
  private final ShelterService service;

  public ShelterController(ShelterService service) {
    this.service = service;
  }

  @GetMapping
  public List<Shelter> list() {
    return service.list();
  }
}
