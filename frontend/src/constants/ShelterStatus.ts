export const ShelterStatus = ["CLOSED","STANDBY","OPEN","FULL"] as const;
export type ShelterStatus = (typeof ShelterStatus)[number];
export const ShelterStatusText: Record<ShelterStatus, string> = {
  CLOSED: "已关闭",
  STANDBY: "待命",
  OPEN: "开放中",
  FULL: "已满员"
};
