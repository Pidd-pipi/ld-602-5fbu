export const DispatchStatus = ["DRAFT","SUBMITTED","APPROVED","DISPATCHED","RECEIVED","REJECTED"] as const;
export type DispatchStatus = (typeof DispatchStatus)[number];
export const DispatchStatusText: Record<DispatchStatus, string> = {
  DRAFT: "草稿",
  SUBMITTED: "待审批",
  APPROVED: "已批准",
  DISPATCHED: "已出库",
  RECEIVED: "已签收",
  REJECTED: "已驳回"
};

/** 列表/详情用的流转分组与步骤条顺序 */
export const DispatchStatusOrder: DispatchStatus[] = ["SUBMITTED", "APPROVED", "DISPATCHED", "RECEIVED"];

/** 状态 -> 时间线已完成步数（REJECTED 单独处理） */
export const DispatchStatusStep: Record<DispatchStatus, number> = {
  DRAFT: 0,
  SUBMITTED: 1,
  APPROVED: 2,
  DISPATCHED: 3,
  RECEIVED: 4,
  REJECTED: 1
};

export const DispatchStatusFilterOptions: { value: DispatchStatus | ""; label: string }[] = [
  { value: "", label: "全部状态" },
  ...DispatchStatus.map((value) => ({ value, label: DispatchStatusText[value] }))
];
