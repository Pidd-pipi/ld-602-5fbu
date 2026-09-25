// 本地种子数据：全部来源于本地库，禁止接入第三方 API。
// 日期以 2026-09-25 为基准布置临期/过期批次，便于演示 FEFO 出库。
export const mockData = {
  "warehouse": [
    {
      "id": 1,
      "name": "江岸区中心应急仓",
      "district": "江岸区",
      "address": "武汉路 12 号",
      "manager_id": 1,
      "capacity_level": 3,
      "contact_phone": "027-88000001",
      "status": "ACTIVE"
    },
    {
      "id": 2,
      "name": "汉阳区应急储备库",
      "district": "汉阳区",
      "address": "鹦鹉大道 57 号",
      "manager_id": 2,
      "capacity_level": 2,
      "contact_phone": "027-88000002",
      "status": "ACTIVE"
    },
    {
      "id": 3,
      "name": "硚口区老物资仓库",
      "district": "硚口区",
      "address": "古田三路 9 号",
      "manager_id": 3,
      "capacity_level": 1,
      "contact_phone": "027-88000003",
      "status": "DISABLED"
    }
  ],
  "supplyItem": [
    {
      "id": 1,
      "sku_code": "WATER-550ML",
      "name": "瓶装饮用水 550ml",
      "category": "WATER",
      "unit": "箱",
      "safety_stock": 100,
      "expire_days": 720,
      "storage_requirement": "常温避光"
    },
    {
      "id": 2,
      "sku_code": "FOOD-BISCUIT",
      "name": "压缩干粮",
      "category": "FOOD",
      "unit": "箱",
      "safety_stock": 80,
      "expire_days": 540,
      "storage_requirement": "干燥通风"
    },
    {
      "id": 3,
      "sku_code": "MED-KIT-A",
      "name": "医用急救包 A 型",
      "category": "MEDICAL",
      "unit": "套",
      "safety_stock": 30,
      "expire_days": 365,
      "storage_requirement": "阴凉防潮"
    },
    {
      "id": 4,
      "sku_code": "SHELTER-TENT-12",
      "name": "12 平米折叠帐篷",
      "category": "SHELTER",
      "unit": "顶",
      "safety_stock": 20,
      "expire_days": 1825,
      "storage_requirement": "室外堆场"
    },
    {
      "id": 5,
      "sku_code": "TOOL-LIFE-VEST",
      "name": "救生衣",
      "category": "RESCUE_TOOL",
      "unit": "件",
      "safety_stock": 50,
      "expire_days": 1095,
      "storage_requirement": "常温存放"
    }
  ],
  "inventoryBatch": [
    // 江岸区中心应急仓
    { "id": 101, "warehouse_id": 1, "supply_item_id": 1, "batch_no": "W2406-15", "quantity": 120, "expire_at": "2026-10-10T09:00:00Z", "inbound_source": "市级应急物资调拨", "quality_status": "NEAR_EXPIRE" },
    { "id": 102, "warehouse_id": 1, "supply_item_id": 1, "batch_no": "W2502-03", "quantity": 200, "expire_at": "2027-04-01T09:00:00Z", "inbound_source": "集中采购入库", "quality_status": "QUALIFIED" },
    { "id": 103, "warehouse_id": 1, "supply_item_id": 2, "batch_no": "F2405-22", "quantity": 40, "expire_at": "2026-10-02T09:00:00Z", "inbound_source": "社会捐赠", "quality_status": "NEAR_EXPIRE" },
    { "id": 104, "warehouse_id": 1, "supply_item_id": 2, "batch_no": "F2503-11", "quantity": 100, "expire_at": "2027-05-01T09:00:00Z", "inbound_source": "集中采购入库", "quality_status": "QUALIFIED" },
    { "id": 105, "warehouse_id": 1, "supply_item_id": 3, "batch_no": "M2401-08", "quantity": 20, "expire_at": "2026-08-01T09:00:00Z", "inbound_source": "区级轮换物资", "quality_status": "EXPIRED" },
    { "id": 106, "warehouse_id": 1, "supply_item_id": 3, "batch_no": "M2501-19", "quantity": 25, "expire_at": "2027-01-10T09:00:00Z", "inbound_source": "集中采购入库", "quality_status": "QUALIFIED" },
    { "id": 107, "warehouse_id": 1, "supply_item_id": 4, "batch_no": "T2408-30", "quantity": 15, "expire_at": "2027-06-01T09:00:00Z", "inbound_source": "市级应急物资调拨", "quality_status": "QUALIFIED" },
    // 汉阳区应急储备库
    { "id": 201, "warehouse_id": 2, "supply_item_id": 1, "batch_no": "W2501-42", "quantity": 300, "expire_at": "2027-02-01T09:00:00Z", "inbound_source": "集中采购入库", "quality_status": "QUALIFIED" },
    { "id": 202, "warehouse_id": 2, "supply_item_id": 5, "batch_no": "V2412-07", "quantity": 60, "expire_at": "2027-03-01T09:00:00Z", "inbound_source": "社会捐赠", "quality_status": "QUALIFIED" },
    // 硚口区老物资仓库（已停用）
    { "id": 301, "warehouse_id": 3, "supply_item_id": 1, "batch_no": "W2309-51", "quantity": 500, "expire_at": "2026-11-20T09:00:00Z", "inbound_source": "历史储备", "quality_status": "NEAR_EXPIRE" }
  ],
  "shelter": [
    {
      "id": 1,
      "name": "江汉路街道避难点",
      "district": "江岸区",
      "capacity": 500,
      "current_population": 320,
      "contact_person": "周敏",
      "risk_level": "HIGH",
      "open_status": "OPEN"
    },
    {
      "id": 2,
      "name": "鹦鹉洲社区安置点",
      "district": "汉阳区",
      "capacity": 300,
      "current_population": 180,
      "contact_person": "李强",
      "risk_level": "MEDIUM",
      "open_status": "OPEN"
    },
    {
      "id": 3,
      "name": "古田街道临时安置点",
      "district": "硚口区",
      "capacity": 200,
      "current_population": 0,
      "contact_person": "陈芳",
      "risk_level": "LOW",
      "open_status": "STANDBY"
    }
  ],
  "dispatchOrder": [
    {
      "id": 1,
      "order_no": "DB-20260924-001",
      "event_id": 1,
      "event_name": "9·24 沿江强降雨内涝",
      "source_warehouse_id": 1,
      "shelter_id": 1,
      "priority": "URGENT",
      "status": "SUBMITTED",
      "requested_by": "周敏（江汉路街道避难点）",
      "requested_at": "2026-09-24T20:15:00Z",
      "approved_by": "",
      "approved_at": "",
      "dispatched_at": "",
      "received_at": "",
      "decision_note": "",
      "lines": [
        {
          "id": 11,
          "supply_item_id": 1,
          "requested_quantity": 150,
          "allocations": []
        },
        {
          "id": 12,
          "supply_item_id": 2,
          "requested_quantity": 120,
          "allocations": []
        }
      ],
      "gaps": [],
      "block_reasons": [],
      "progress": [
        { "status": "SUBMITTED", "at": "2026-09-24T20:15:00Z", "actor": "周敏", "remark": "避难点提交物资申请" }
      ]
    },
    {
      "id": 2,
      "order_no": "DB-20260925-002",
      "event_id": 1,
      "event_name": "9·24 沿江强降雨内涝",
      "source_warehouse_id": 1,
      "shelter_id": 1,
      "priority": "HIGH",
      "status": "SUBMITTED",
      "requested_by": "周敏（江汉路街道避难点）",
      "requested_at": "2026-09-25T08:40:00Z",
      "approved_by": "",
      "approved_at": "",
      "dispatched_at": "",
      "received_at": "",
      "decision_note": "",
      "lines": [
        {
          "id": 21,
          "supply_item_id": 3,
          "requested_quantity": 60,
          "allocations": []
        }
      ],
      "gaps": [],
      "block_reasons": [],
      "progress": [
        { "status": "SUBMITTED", "at": "2026-09-25T08:40:00Z", "actor": "周敏", "remark": "避难点提交物资申请" }
      ]
    },
    {
      "id": 3,
      "order_no": "DB-20260925-003",
      "event_id": 2,
      "event_name": "9·25 汉江北岸人员转移",
      "source_warehouse_id": 3,
      "shelter_id": 3,
      "priority": "NORMAL",
      "status": "SUBMITTED",
      "requested_by": "陈芳（古田街道临时安置点）",
      "requested_at": "2026-09-25T09:05:00Z",
      "approved_by": "",
      "approved_at": "",
      "dispatched_at": "",
      "received_at": "",
      "decision_note": "",
      "lines": [
        {
          "id": 31,
          "supply_item_id": 1,
          "requested_quantity": 80,
          "allocations": []
        }
      ],
      "gaps": [],
      "block_reasons": [],
      "progress": [
        { "status": "SUBMITTED", "at": "2026-09-25T09:05:00Z", "actor": "陈芳", "remark": "避难点提交物资申请" }
      ]
    },
    {
      "id": 4,
      "order_no": "DB-20260923-004",
      "event_id": 3,
      "event_name": "9·23 鹦鹉洲积水排险",
      "source_warehouse_id": 2,
      "shelter_id": 2,
      "priority": "HIGH",
      "status": "APPROVED",
      "requested_by": "李强（鹦鹉洲社区安置点）",
      "requested_at": "2026-09-23T14:20:00Z",
      "approved_by": "调度员 王磊",
      "approved_at": "2026-09-23T15:02:00Z",
      "dispatched_at": "",
      "received_at": "",
      "decision_note": "批次方案已确认，等待仓库出库。",
      "lines": [
        {
          "id": 41,
          "supply_item_id": 1,
          "requested_quantity": 80,
          "allocations": [
            { "batch_id": 201, "batch_no": "W2501-42", "expire_at": "2027-02-01T09:00:00Z", "available_quantity": 300, "allocated_quantity": 80, "near_expire": false }
          ]
        }
      ],
      "gaps": [],
      "block_reasons": [],
      "progress": [
        { "status": "SUBMITTED", "at": "2026-09-23T14:20:00Z", "actor": "李强", "remark": "避难点提交物资申请" },
        { "status": "APPROVED", "at": "2026-09-23T15:02:00Z", "actor": "王磊", "remark": "批准并锁定 FEFO 批次方案" }
      ]
    },
    {
      "id": 5,
      "order_no": "DB-20260922-005",
      "event_id": 3,
      "event_name": "9·23 鹦鹉洲积水排险",
      "source_warehouse_id": 2,
      "shelter_id": 2,
      "priority": "NORMAL",
      "status": "DISPATCHED",
      "requested_by": "李强（鹦鹉洲社区安置点）",
      "requested_at": "2026-09-22T11:00:00Z",
      "approved_by": "调度员 王磊",
      "approved_at": "2026-09-22T11:30:00Z",
      "dispatched_at": "2026-09-22T13:10:00Z",
      "received_at": "",
      "decision_note": "批次已出库，运输中。",
      "lines": [
        {
          "id": 51,
          "supply_item_id": 5,
          "requested_quantity": 40,
          "allocations": [
            { "batch_id": 202, "batch_no": "V2412-07", "expire_at": "2027-03-01T09:00:00Z", "available_quantity": 60, "allocated_quantity": 40, "near_expire": false }
          ]
        }
      ],
      "gaps": [],
      "block_reasons": [],
      "progress": [
        { "status": "SUBMITTED", "at": "2026-09-22T11:00:00Z", "actor": "李强", "remark": "避难点提交物资申请" },
        { "status": "APPROVED", "at": "2026-09-22T11:30:00Z", "actor": "王磊", "remark": "批准并锁定 FEFO 批次方案" },
        { "status": "DISPATCHED", "at": "2026-09-22T13:10:00Z", "actor": "仓库员 赵刚", "remark": "按批次完成出库装车" }
      ]
    },
    {
      "id": 6,
      "order_no": "DB-20260920-006",
      "event_id": 4,
      "event_name": "9·20 台风外围强风避险",
      "source_warehouse_id": 2,
      "shelter_id": 2,
      "priority": "NORMAL",
      "status": "RECEIVED",
      "requested_by": "李强（鹦鹉洲社区安置点）",
      "requested_at": "2026-09-20T09:30:00Z",
      "approved_by": "调度员 王磊",
      "approved_at": "2026-09-20T10:00:00Z",
      "dispatched_at": "2026-09-20T11:15:00Z",
      "received_at": "2026-09-20T12:40:00Z",
      "decision_note": "物资全部签收，数量无误。",
      "lines": [
        {
          "id": 61,
          "supply_item_id": 1,
          "requested_quantity": 30,
          "allocations": [
            { "batch_id": 201, "batch_no": "W2501-42", "expire_at": "2027-02-01T09:00:00Z", "available_quantity": 380, "allocated_quantity": 30, "near_expire": false }
          ]
        }
      ],
      "gaps": [],
      "block_reasons": [],
      "progress": [
        { "status": "SUBMITTED", "at": "2026-09-20T09:30:00Z", "actor": "李强", "remark": "避难点提交物资申请" },
        { "status": "APPROVED", "at": "2026-09-20T10:00:00Z", "actor": "王磊", "remark": "批准并锁定 FEFO 批次方案" },
        { "status": "DISPATCHED", "at": "2026-09-20T11:15:00Z", "actor": "赵刚", "remark": "按批次完成出库装车" },
        { "status": "RECEIVED", "at": "2026-09-20T12:40:00Z", "actor": "李强", "remark": "现场清点签收，数量与批次一致" }
      ]
    }
  ]
} as const;
