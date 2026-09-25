export const LOG_TEMPLATES = {
  Warehouse: ["应急仓库创建", "应急仓库更新", "应急仓库状态变更", "应急仓库导出"],
  SupplyItem: ["应急物资创建", "应急物资更新", "应急物资状态变更", "应急物资导出"],
  InventoryBatch: ["库存批次创建", "库存批次更新", "库存批次状态变更", "库存批次报损"],
  Shelter: ["避难安置点创建", "避难安置点更新", "避难安置点状态变更", "避难安置点导出"],
  DispatchOrder: [
    "调拨单 {orderNo} 由避难点 {shelter} 提交申请",
    "调拨单 {orderNo} 批准通过，按 FEFO 分配 {lines} 项批次",
    "调拨单 {orderNo} 库存不足保持待审，缺口：{gaps}",
    "调拨单 {orderNo} 批次 {batchNo} 出库 {quantity} {unit}",
    "调拨单 {orderNo} 由 {shelter} 签收确认",
    "调拨单 {orderNo} 驳回：{reason}"
  ]
};
