package com.generated.rescueStock.services;

import java.util.*;
import org.springframework.stereotype.Service;
import com.generated.rescueStock.models.Shelter;
import com.generated.rescueStock.repositories.ShelterRepository;

@Service
public class ShelterService {
  private final ShelterRepository repo;
  public ShelterService(ShelterRepository repo) { this.repo = repo; }
  public List<Shelter> list() { return repo.findAll(); }
}
