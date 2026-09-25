export const ERROR_MESSAGES = {
  AUTH_REQUIRED: "请先登录后再继续操作",
  RBAC_DENIED: "当前角色没有执行该动作的权限",
  VALIDATION_FAILED: "表单字段缺失或格式错误",
  RATE_LIMITED: "请求过于频繁，请稍后再试",
  WAREHOUSE_DISABLED: "来源仓库已停用，无法继续审批：{warehouse}",
  INSUFFICIENT_BATCH_STOCK: "物资「{supply}」批次库存不足，缺口 {gap}{unit}，单据保持待审批",
  BELOW_SAFETY_STOCK: "物资「{supply}」出库后库存 {remaining}{unit} 将低于安全库存 {safety}{unit}，必须填写强制出库原因",
  FORCE_REASON_REQUIRED: "存在低于安全库存的物资，请先填写原因再批准",
  ORDER_STATUS_INVALID: "当前单据状态不允许执行该操作",
  EMPTY_DISPATCH_LINES: "请至少添加一条物资申请明细"
};
