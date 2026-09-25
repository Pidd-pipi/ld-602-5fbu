/** 距到期日小于等于该天数视为临期批次 */
export const NEAR_EXPIRY_DAYS = 30;

const pad = (value: number) => String(value).padStart(2, "0");

export const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

export const formatDateTime = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return `${formatDate(value)} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export const formatStatus = (value: string) => value.replace(/_/g, " ");
export const formatNumber = (value: number) => new Intl.NumberFormat("zh-CN").format(value ?? 0);
export const formatRisk = (value: string) => ({ LOW: "低", MEDIUM: "中", HIGH: "高", CRITICAL: "严重", EXTREME: "极高" }[value] ?? value);

/** 距今天数：负数表示已过期 */
export const daysUntil = (expireAt: string, now: Date = new Date()): number => {
  const expire = new Date(expireAt);
  const ms = expire.getTime() - now.getTime();
  return Math.ceil(ms / 86_400_000);
};

/** 到期标签：已过期 / 还剩 N 天 / YYYY-MM-DD */
export const formatExpireLabel = (expireAt: string): string => {
  const days = daysUntil(expireAt);
  if (days < 0) return `已过期 ${Math.abs(days)} 天`;
  if (days === 0) return "今日到期";
  return `还剩 ${days} 天`;
};

export const isNearExpiry = (expireAt: string, windowDays = NEAR_EXPIRY_DAYS): boolean => {
  const days = daysUntil(expireAt);
  return days >= 0 && days <= windowDays;
};
