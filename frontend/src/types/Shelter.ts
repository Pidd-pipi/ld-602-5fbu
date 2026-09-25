import type { ShelterStatus } from "../constants/ShelterStatus";

export type ShelterRiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface Shelter {
  id: number;
  name: string;
  district: string;
  capacity: number;
  current_population: number;
  contact_person: string;
  contact_phone: string;
  risk_level: ShelterRiskLevel;
  open_status: ShelterStatus;
}
