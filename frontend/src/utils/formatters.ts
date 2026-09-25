import { DispatchStatusText } from "../constants/DispatchStatus";
import { DispatchPriorityText } from "../constants/DispatchRule";
import { BatchQualityStatusText } from "../constants/DispatchRule";

export const formatDate = (value: string) =>
  value ? new Date(value).toLocaleString("zh-CN", { hour12: false }) : "—";

export const formatDay = (value: string) =>
  value ? new Date(value).toLocaleDateString("zh-CN") : "—";

export const formatStatus = (value: string) =>
  (DispatchStatusText as Record<string, string>)[value] ?? value.replace(/_/g, " ");

export const formatNumber = (value: number) => new Intl.NumberFormat("zh-CN").format(value);

export const formatRisk = (value: string) =>
  ({ LOW: "低", MEDIUM: "中", HIGH: "高", CRITICAL: "严重", EXTREME: "极高" }[value] ?? value);

export const formatPriority = (value: string) =>
  (DispatchPriorityText as Record<string, string>)[value] ?? value;

export const formatBatchQuality = (value: string) =>
  (BatchQualityStatusText as Record<string, string>)[value] ?? value;

/** 剩余到期天数，负数代表已过期 */
export const daysToExpire = (expireAt: string, now: Date = new Date()): number =>
  Math.ceil((new Date(expireAt).getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

export const formatExpireTag = (expireAt: string): string => {
  const days = daysToExpire(expireAt);
  if (days < 0) return `已过期 ${Math.abs(days)} 天`;
  if (days === 0) return "今日到期";
  if (days <= 30) return `${days} 天后到期`;
  return `${days} 天后到期`;
};
