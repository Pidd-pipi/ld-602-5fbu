export const LOG_TEMPLATES = {
  Warehouse: ["应急仓库创建", "应急仓库更新", "应急仓库状态变更", "应急仓库导出"],
  SupplyItem: ["应急物资创建", "应急物资更新", "应急物资状态变更", "应急物资导出"],
  InventoryBatch: ["库存批次创建", "库存批次更新", "库存批次状态变更", "库存批次扣减出库"],
  Shelter: ["避难安置点创建", "避难安置点更新", "避难安置点状态变更", "避难安置点导出"],
  DispatchOrder: [
    "调拨单创建",
    "调拨单更新",
    "调拨单提交审批",
    "调拨单审批通过并冻结批次",
    "调拨单库存缺口保持待审",
    "调拨单低于安全库存强制批准",
    "调拨单驳回",
    "调拨单批次出库",
    "调拨单签收确认",
    "调拨单导出"
  ]
};

export const TimelineActionText: Record<string, string> = {
  SUBMIT: "避难点提交申请",
  CHECK: "审批校验未通过",
  APPROVE: "审批通过（批次已冻结）",
  REJECT: "审批驳回",
  DISPATCH: "仓库出库",
  RECEIVE: "避难点签收"
};
