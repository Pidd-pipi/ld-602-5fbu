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
/** 审批流的正向顺序，时间线按此排序 */
export const DispatchStatusOrder: DispatchStatus[] = ["SUBMITTED","APPROVED","DISPATCHED","RECEIVED"];
