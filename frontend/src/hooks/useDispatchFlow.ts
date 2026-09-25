import { computed, type Ref } from "vue";
import { DispatchStatusOrder } from "../constants/DispatchStatus";
import type { DispatchOrder, DispatchProgress } from "../types/DispatchOrder";

export interface FlowStep {
  status: (typeof DispatchStatusOrder)[number];
  label: string;
  reached: boolean;
  current: boolean;
  at: string;
  actor: string;
  remark?: string;
}

/** 调拨审批流：根据单据时间线生成 申请→批准→出库→签收 的步骤状态 */
export function useDispatchFlow(orderRef: Ref<DispatchOrder | undefined | null>) {
  const steps = computed<FlowStep[]>(() => {
    const order = orderRef.value;
    if (!order) return [];
    const byStatus = new Map<DispatchProgress["status"], DispatchProgress>();
    for (const point of order.progress) byStatus.set(point.status, point);
    const rejected = order.status === "REJECTED";
    return DispatchStatusOrder.map((status, index) => {
      const point = byStatus.get(status);
      const currentIndex = DispatchStatusOrder.indexOf(order.status as (typeof DispatchStatusOrder)[number]);
      return {
        status,
        label: ["提交申请", "调度批准", "仓库出库", "避难点签收"][index],
        reached: Boolean(point),
        current: !rejected && order.status === status,
        at: point?.at ?? "",
        actor: point?.actor ?? "",
        remark: point?.remark
      };
    });
  });

  const rejected = computed(() => orderRef.value?.status === "REJECTED");
  const canApprove = computed(() => orderRef.value?.status === "SUBMITTED");
  const canDispatch = computed(() => orderRef.value?.status === "APPROVED");
  const canReceive = computed(() => orderRef.value?.status === "DISPATCHED");

  return { steps, rejected, canApprove, canDispatch, canReceive };
}
