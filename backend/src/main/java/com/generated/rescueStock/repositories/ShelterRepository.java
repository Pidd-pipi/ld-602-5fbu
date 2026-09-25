package com.generated.rescueStock.repositories;

import java.util.*;
import org.springframework.stereotype.Repository;
import com.generated.rescueStock.models.Shelter;

@Repository
public class ShelterRepository {
  private final InMemoryDatabase db;
  public ShelterRepository(InMemoryDatabase db) { this.db = db; }
  public List<Shelter> findAll() { return new ArrayList<>(db.shelters.values()); }
  public Optional<Shelter> findById(long id) { return Optional.ofNullable(db.shelters.get(id)); }
}
