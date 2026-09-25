export const ERROR_MESSAGES = {
  AUTH_REQUIRED: "请先登录后再继续操作",
  RBAC_DENIED: "当前角色没有执行该动作的权限",
  VALIDATION_FAILED: "表单字段缺失或格式错误",
  RATE_LIMITED: "请求过于频繁，请稍后再试",
  DISPATCH_WAREHOUSE_DISABLED: "来源仓库「{warehouse}」已停用，无法调拨出库",
  DISPATCH_STOCK_SHORTAGE: "物资「{supply}」库存不足，缺口 {shortage} {unit}，单据保持待审批",
  DISPATCH_BELOW_SAFETY: "按 FEFO 出库后，仓库「{warehouse}」物资「{supply}」余量 {remain} {unit}，低于安全库存 {safety} {unit}",
  DISPATCH_STATUS_CONFLICT: "当前状态为 {status}，不能执行 {action}",
  DISPATCH_NOT_FOUND: "调拨单不存在或已被处理"
};
