import { requestJson } from "./http";
import { localList, localSave } from "../services/localGateway";
import type { Shelter } from "../types/Shelter";

const endpoint = "/api/shelter";

export async function listShelter(): Promise<Shelter[]> {
  try {
    return await requestJson<Shelter[]>(endpoint);
  } catch {
    // Local fallback keeps the UI available during offline review.
    return localList("shelter");
  }
}

export async function saveShelter(payload: Shelter): Promise<Shelter> {
  const rows = localList("shelter");
  const index = rows.findIndex((row) => row.id === payload.id);
  if (index >= 0) rows[index] = payload;
  else rows.push(payload);
  localSave("shelter", rows);
  return payload;
}
