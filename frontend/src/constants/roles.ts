/**
 * RBAC 角色与动作权限矩阵。
 * 横切：路由守卫、组件按钮显隐、store 操作前校验、错误码/日志模板共用。
 */
export const UserRoles = ["STREET_ADMIN", "WAREHOUSE_KEEPER", "DISPATCHER", "OBSERVER"] as const;
export type UserRole = (typeof UserRoles)[number];

export const UserRoleText: Record<UserRole, string> = {
  STREET_ADMIN: "街道管理员",
  WAREHOUSE_KEEPER: "仓库员",
  DISPATCHER: "审批员",
  OBSERVER: "只读观察员"
};

/** 调拨审批页动作 */
export type DispatchAction =
  | "create"
  | "approve"
  | "reject"
  | "dispatch"
  | "receive"
  | "toggleWarehouse";

/** 仓库/物资相关动作 */
export type WarehouseAction = "toggleWarehouse";

const ALL: DispatchAction[] = ["create", "approve", "reject", "dispatch", "receive", "toggleWarehouse"];

/** 避难点申报：街道管理员、仓库员可发起；审批员负责审批流；观察员只读 */
export const RolePermissions: Record<UserRole, DispatchAction[]> = {
  STREET_ADMIN: ALL,
  WAREHOUSE_KEEPER: ["create", "dispatch", "toggleWarehouse"],
  DISPATCHER: ["approve", "reject", "receive"],
  OBSERVER: []
};

export const canPerform = (role: UserRole, action: DispatchAction): boolean =>
  RolePermissions[role].includes(action);

/** 登录态在 localStorage 的键，与业务数据持久化分开 */
export const SESSION_STORAGE_KEY = "rescue-stock:session";
