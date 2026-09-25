export type TimelineAction =
  | "SUBMIT"
  | "CHECK"
  | "APPROVE"
  | "REJECT"
  | "DISPATCH"
  | "RECEIVE";

export interface ApprovalTimelineEntry {
  id: number;
  action: TimelineAction;
  actor: string;
  note: string;
  created_at: string;
}
