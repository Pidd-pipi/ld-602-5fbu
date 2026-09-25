-- 城市防灾应急物资调度系统（rescue-stock）数据库结构
-- MySQL 8.0；由 docker-entrypoint-initdb.d 在首次启动时自动执行。

CREATE TABLE IF NOT EXISTS warehouse (
  id BIGINT PRIMARY KEY,
  name VARCHAR(128) NOT NULL COMMENT '仓库名称',
  district VARCHAR(64) NOT NULL COMMENT '所属行政区',
  address VARCHAR(255) NOT NULL COMMENT '详细地址',
  manager_id BIGINT COMMENT '负责人 ID',
  capacity_level INT DEFAULT 1 COMMENT '容量等级 1-3',
  contact_phone VARCHAR(32) COMMENT '联系电话',
  status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE' COMMENT 'ACTIVE 启用 / DISABLED 停用'
) COMMENT '应急仓库';

CREATE TABLE IF NOT EXISTS supply_item (
  id BIGINT PRIMARY KEY,
  sku_code VARCHAR(64) NOT NULL COMMENT '物资编码',
  name VARCHAR(128) NOT NULL COMMENT '物资名称',
  category VARCHAR(32) NOT NULL COMMENT 'FOOD/WATER/MEDICAL/SHELTER/RESCUE_TOOL',
  unit VARCHAR(16) NOT NULL COMMENT '计量单位',
  safety_stock INT NOT NULL DEFAULT 0 COMMENT '安全库存线',
  expire_days INT NOT NULL DEFAULT 365 COMMENT '保质期（天）',
  storage_requirement VARCHAR(255) COMMENT '存储要求'
) COMMENT '应急物资档案';

CREATE TABLE IF NOT EXISTS inventory_batch (
  id BIGINT PRIMARY KEY,
  warehouse_id BIGINT NOT NULL COMMENT '所属仓库',
  supply_item_id BIGINT NOT NULL COMMENT '物资 ID',
  batch_no VARCHAR(64) NOT NULL COMMENT '批次号',
  quantity INT NOT NULL DEFAULT 0 COMMENT '批次剩余量',
  expire_at DATETIME NOT NULL COMMENT '到期日（FEFO 出库依据）',
  inbound_source VARCHAR(128) COMMENT '入库来源',
  quality_status VARCHAR(16) NOT NULL DEFAULT 'QUALIFIED' COMMENT 'QUALIFIED/NEAR_EXPIRE/EXPIRED/DAMAGED',
  INDEX idx_batch_wh_item (warehouse_id, supply_item_id),
  INDEX idx_batch_expire (expire_at),
  CONSTRAINT fk_batch_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouse(id),
  CONSTRAINT fk_batch_item FOREIGN KEY (supply_item_id) REFERENCES supply_item(id)
) COMMENT '库存批次';

CREATE TABLE IF NOT EXISTS shelter (
  id BIGINT PRIMARY KEY,
  name VARCHAR(128) NOT NULL COMMENT '避难点名称',
  district VARCHAR(64) NOT NULL COMMENT '所属行政区',
  capacity INT NOT NULL DEFAULT 0 COMMENT '可容纳人数',
  current_population INT NOT NULL DEFAULT 0 COMMENT '当前安置人数',
  contact_person VARCHAR(64) COMMENT '联系人',
  risk_level VARCHAR(16) NOT NULL DEFAULT 'LOW' COMMENT 'LOW/MEDIUM/HIGH',
  open_status VARCHAR(16) NOT NULL DEFAULT 'STANDBY' COMMENT 'CLOSED/STANDBY/OPEN/FULL'
) COMMENT '避难安置点';

CREATE TABLE IF NOT EXISTS dispatch_order (
  id BIGINT PRIMARY KEY,
  order_no VARCHAR(32) NOT NULL UNIQUE COMMENT '调拨单号',
  event_id BIGINT COMMENT '关联灾害事件 ID',
  event_name VARCHAR(128) COMMENT '事件名称（冗余便于列表展示）',
  source_warehouse_id BIGINT NOT NULL COMMENT '来源仓库',
  shelter_id BIGINT NOT NULL COMMENT '接收避难点',
  priority VARCHAR(16) NOT NULL DEFAULT 'NORMAL' COMMENT 'URGENT/HIGH/NORMAL',
  status VARCHAR(16) NOT NULL DEFAULT 'SUBMITTED' COMMENT 'DRAFT/SUBMITTED/APPROVED/DISPATCHED/RECEIVED/REJECTED',
  requested_by VARCHAR(64) COMMENT '申请人',
  requested_at DATETIME COMMENT '申请时间',
  approved_by VARCHAR(64) COMMENT '批准人',
  approved_at DATETIME COMMENT '批准时间',
  dispatched_at DATETIME COMMENT '出库时间',
  received_at DATETIME COMMENT '签收时间',
  decision_note TEXT COMMENT '审批结论（缺口/安全库存/停用原因）',
  INDEX idx_dispatch_status (status),
  CONSTRAINT fk_dispatch_warehouse FOREIGN KEY (source_warehouse_id) REFERENCES warehouse(id),
  CONSTRAINT fk_dispatch_shelter FOREIGN KEY (shelter_id) REFERENCES shelter(id)
) COMMENT '调拨单主表';

CREATE TABLE IF NOT EXISTS dispatch_line (
  id BIGINT PRIMARY KEY,
  dispatch_order_id BIGINT NOT NULL COMMENT '所属调拨单',
  supply_item_id BIGINT NOT NULL COMMENT '申请物资',
  requested_quantity INT NOT NULL COMMENT '申请数量',
  CONSTRAINT fk_line_order FOREIGN KEY (dispatch_order_id) REFERENCES dispatch_order(id) ON DELETE CASCADE,
  CONSTRAINT fk_line_item FOREIGN KEY (supply_item_id) REFERENCES supply_item(id)
) COMMENT '调拨申请明细行';

-- 批准时按 FEFO 锁定的批次分配方案；出库时据此扣减 inventory_batch.quantity
CREATE TABLE IF NOT EXISTS dispatch_batch_allocation (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  dispatch_line_id BIGINT NOT NULL COMMENT '所属明细行',
  batch_id BIGINT NOT NULL COMMENT '被分配的库存批次',
  allocated_quantity INT NOT NULL COMMENT '本批次扣减数量',
  near_expire TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否临期批次（先出）',
  CONSTRAINT fk_alloc_line FOREIGN KEY (dispatch_line_id) REFERENCES dispatch_line(id) ON DELETE CASCADE,
  CONSTRAINT fk_alloc_batch FOREIGN KEY (batch_id) REFERENCES inventory_batch(id)
) COMMENT '调拨单 FEFO 批次分配（快照）';

-- 库存不足时按物资记录缺口，单据保持 SUBMITTED
CREATE TABLE IF NOT EXISTS dispatch_gap (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  dispatch_order_id BIGINT NOT NULL,
  supply_item_id BIGINT NOT NULL,
  requested_quantity INT NOT NULL,
  available_quantity INT NOT NULL,
  shortage_quantity INT NOT NULL,
  CONSTRAINT fk_gap_order FOREIGN KEY (dispatch_order_id) REFERENCES dispatch_order(id) ON DELETE CASCADE,
  CONSTRAINT fk_gap_item FOREIGN KEY (supply_item_id) REFERENCES supply_item(id)
) COMMENT '调拨库存缺口';

-- 仓库停用 / 跌破安全库存等阻塞原因
CREATE TABLE IF NOT EXISTS dispatch_block_reason (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  dispatch_order_id BIGINT NOT NULL,
  level VARCHAR(8) NOT NULL COMMENT 'ERROR / WARNING',
  code VARCHAR(32) NOT NULL COMMENT 'WAREHOUSE_DISABLED / BELOW_SAFETY_STOCK 等',
  message VARCHAR(512) NOT NULL,
  CONSTRAINT fk_block_order FOREIGN KEY (dispatch_order_id) REFERENCES dispatch_order(id) ON DELETE CASCADE
) COMMENT '调拨阻塞原因';

-- 审批 / 出库 / 签收结果时间线，列表与详情共用
CREATE TABLE IF NOT EXISTS dispatch_progress (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  dispatch_order_id BIGINT NOT NULL,
  status VARCHAR(16) NOT NULL COMMENT '节点状态',
  actor VARCHAR(64) COMMENT '操作人',
  remark VARCHAR(512) COMMENT '备注（含放行/驳回原因）',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_progress_order (dispatch_order_id, id),
  CONSTRAINT fk_progress_order FOREIGN KEY (dispatch_order_id) REFERENCES dispatch_order(id) ON DELETE CASCADE
) COMMENT '调拨审批流时间线';

CREATE TABLE IF NOT EXISTS audit_log (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  actor VARCHAR(64),
  action VARCHAR(128),
  target_type VARCHAR(32),
  target_id VARCHAR(64),
  detail TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_target (target_type, target_id)
) COMMENT '操作日志（库存流水双写）';
