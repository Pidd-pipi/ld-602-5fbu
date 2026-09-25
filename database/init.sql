-- 城市防灾应急物资调度系统 rescue-stock 初始化脚本（MySQL 8.0）

CREATE TABLE IF NOT EXISTS warehouse (
  id BIGINT PRIMARY KEY,
  name VARCHAR(100) NOT NULL COMMENT '仓库名称',
  district VARCHAR(50) NOT NULL COMMENT '所在区县',
  address VARCHAR(200) NOT NULL,
  manager_id BIGINT,
  manager_name VARCHAR(50),
  capacity_level INT DEFAULT 1 COMMENT '容量等级 1-3',
  contact_phone VARCHAR(30),
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' COMMENT 'ACTIVE/DISABLED',
  disabled_reason VARCHAR(500) NOT NULL DEFAULT '' COMMENT '停用原因，审批拦截时展示'
) COMMENT='应急仓库';

CREATE TABLE IF NOT EXISTS supply_item (
  id BIGINT PRIMARY KEY,
  sku_code VARCHAR(60) NOT NULL,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(20) NOT NULL COMMENT 'FOOD/WATER/MEDICAL/SHELTER/RESCUE_TOOL',
  unit VARCHAR(10) NOT NULL,
  safety_stock INT NOT NULL DEFAULT 0 COMMENT '安全库存，低于时批准需原因',
  expire_days INT NOT NULL DEFAULT 365,
  storage_requirement VARCHAR(200)
) COMMENT='应急物资档案';

CREATE TABLE IF NOT EXISTS inventory_batch (
  id BIGINT PRIMARY KEY,
  warehouse_id BIGINT NOT NULL,
  supply_item_id BIGINT NOT NULL,
  batch_no VARCHAR(60) NOT NULL,
  quantity INT NOT NULL DEFAULT 0 COMMENT '入库数量',
  remaining_quantity INT NOT NULL DEFAULT 0 COMMENT '剩余量，出库按 FEFO 扣减',
  expire_at DATETIME NOT NULL COMMENT '到期日，FEFO 排序依据',
  inbound_source VARCHAR(200),
  quality_status VARCHAR(20) NOT NULL DEFAULT 'QUALIFIED' COMMENT 'QUALIFIED/NEAR_EXPIRY/EXPIRED/QUARANTINED',
  KEY idx_batch_wh_item (warehouse_id, supply_item_id),
  KEY idx_batch_expire (expire_at)
) COMMENT='库存批次';

CREATE TABLE IF NOT EXISTS shelter (
  id BIGINT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  district VARCHAR(50) NOT NULL,
  capacity INT NOT NULL DEFAULT 0,
  current_population INT NOT NULL DEFAULT 0,
  contact_person VARCHAR(50),
  contact_phone VARCHAR(30),
  risk_level VARCHAR(20) NOT NULL DEFAULT 'LOW' COMMENT 'LOW/MEDIUM/HIGH/CRITICAL',
  open_status VARCHAR(20) NOT NULL DEFAULT 'STANDBY' COMMENT 'CLOSED/STANDBY/OPEN/FULL'
) COMMENT='避难安置点';

CREATE TABLE IF NOT EXISTS dispatch_order (
  id BIGINT PRIMARY KEY,
  order_no VARCHAR(40) NOT NULL UNIQUE,
  event_id BIGINT NULL,
  event_name VARCHAR(100) NOT NULL DEFAULT '',
  source_warehouse_id BIGINT NOT NULL,
  shelter_id BIGINT NOT NULL,
  priority VARCHAR(20) NOT NULL DEFAULT 'NORMAL' COMMENT 'URGENT/HIGH/NORMAL',
  status VARCHAR(20) NOT NULL DEFAULT 'SUBMITTED' COMMENT 'DRAFT/SUBMITTED/APPROVED/DISPATCHED/RECEIVED/REJECTED',
  requested_by VARCHAR(50) NOT NULL,
  approved_by VARCHAR(50) NOT NULL DEFAULT '',
  received_by VARCHAR(50) NOT NULL DEFAULT '',
  created_at DATETIME NULL,
  approved_at DATETIME NULL,
  dispatched_at DATETIME NULL,
  received_at DATETIME NULL,
  blocking_reasons TEXT NULL COMMENT '硬拦截原因（仓库停用/库存缺口）JSON 数组',
  warning_reasons TEXT NULL COMMENT '低于安全库存预警 JSON 数组',
  force_reason VARCHAR(500) NOT NULL DEFAULT '' COMMENT '低于安全库存强制出库说明',
  reject_reason VARCHAR(500) NOT NULL DEFAULT '',
  receive_note VARCHAR(500) NOT NULL DEFAULT '',
  KEY idx_dispatch_status (status),
  KEY idx_dispatch_warehouse (source_warehouse_id)
) COMMENT='调拨单聚合';

CREATE TABLE IF NOT EXISTS dispatch_line (
  id BIGINT PRIMARY KEY,
  order_id BIGINT NOT NULL,
  supply_item_id BIGINT NOT NULL,
  quantity INT NOT NULL COMMENT '申请数量',
  available_quantity INT NOT NULL DEFAULT 0 COMMENT '审批时可用量',
  gap_quantity INT NOT NULL DEFAULT 0 COMMENT '缺口数量',
  excluded_expired_quantity INT NOT NULL DEFAULT 0 COMMENT '被排除的过期量',
  excluded_quarantined_quantity INT NOT NULL DEFAULT 0 COMMENT '被排除的隔离量',
  safety_stock INT NOT NULL DEFAULT 0,
  post_remaining INT NOT NULL DEFAULT 0 COMMENT '出库后剩余',
  below_safety_after TINYINT(1) NOT NULL DEFAULT 0,
  KEY idx_line_order (order_id)
) COMMENT='调拨单行';

-- 批准时冻结的 FEFO 批次分配；出库时按此扣减 inventory_batch.remaining_quantity
CREATE TABLE IF NOT EXISTS dispatch_batch_allocation (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT NOT NULL,
  line_id BIGINT NOT NULL,
  batch_id BIGINT NOT NULL,
  fefo_order INT NOT NULL COMMENT '出库顺序，1 为最先出库（临期优先）',
  allocate_quantity INT NOT NULL,
  remaining_before INT NOT NULL,
  remaining_after INT NOT NULL,
  near_expiry TINYINT(1) NOT NULL DEFAULT 0,
  KEY idx_alloc_order (order_id),
  KEY idx_alloc_batch (batch_id)
) COMMENT='调拨批次分配快照（FEFO 冻结）';

CREATE TABLE IF NOT EXISTS dispatch_timeline (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT NOT NULL,
  action VARCHAR(20) NOT NULL COMMENT 'SUBMIT/CHECK/APPROVE/REJECT/DISPATCH/RECEIVE',
  actor VARCHAR(50) NOT NULL,
  note VARCHAR(1000) NOT NULL DEFAULT '',
  created_at DATETIME NOT NULL,
  KEY idx_timeline_order (order_id)
) COMMENT='调拨审批流转时间线';

CREATE TABLE IF NOT EXISTS inventory_flow (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  batch_id BIGINT NOT NULL,
  order_id BIGINT NULL,
  change_type VARCHAR(20) NOT NULL COMMENT 'INBOUND/OUTBOUND/SCRAP/ADJUST',
  change_quantity INT NOT NULL COMMENT '正入负出',
  remaining_after INT NOT NULL,
  actor VARCHAR(50) NOT NULL,
  created_at DATETIME NOT NULL,
  KEY idx_flow_batch (batch_id),
  KEY idx_flow_order (order_id)
) COMMENT='库存流水（与操作日志双写）';

CREATE TABLE IF NOT EXISTS audit_log (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  actor VARCHAR(50) NOT NULL,
  action VARCHAR(60) NOT NULL,
  target_type VARCHAR(30) NOT NULL,
  target_id VARCHAR(40) NOT NULL,
  detail VARCHAR(1000) NOT NULL DEFAULT '',
  created_at DATETIME NOT NULL,
  KEY idx_audit_target (target_type, target_id)
) COMMENT='操作审计日志';
