package com.generated.rescueStock.repositories;

import com.generated.rescueStock.models.Shelter;
import java.util.List;
import org.springframework.stereotype.Repository;

@Repository
public class ShelterRepository {
  private final InMemoryDataRepository data;

  public ShelterRepository(InMemoryDataRepository data) {
    this.data = data;
  }

  public List<Shelter> findAll() {
    return data.shelters;
  }
}
