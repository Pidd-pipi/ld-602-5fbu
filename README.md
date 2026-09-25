# 城市防灾应急物资调度系统（rescue-stock）

面向街道、社区和应急仓库的防灾物资储备与可操作调拨审批平台：避难点在线提交物资申请，审批员点开单据即可看到来源仓库、物资批次剩余量与到期日，系统按「先出临期批次、再出后续批次」（FEFO）自动计算出库顺序；库存不足时单据保持待审并列出缺口，出库将导致低于安全库存或来源仓库停用时必须说明原因；审批、出库、签收全过程留痕，切换页面或刷新后进度仍在。

## 快速启动（推荐 Docker Compose）

```bash
cp .env.example .env && docker compose up -d
```

- 前端：<http://localhost:20102>
- 后端健康检查：<http://localhost:21102/health>
- 重置全部数据：`docker compose down -v` 后重新 `up -d`

> 首次打开若后端尚未就绪，前端会自动回退到浏览器内置的本地种子数据（localStorage 写穿持久化），审批/出库/签收结果在刷新与切换页面后依然保留；后端恢复后自动使用 `/api` 数据。

## 调拨审批可操作流程（核心业务）

1. **提交申请**：避难点在「避难点管理」或「调拨审批」页选择来源仓库、物资与数量提交，单据进入 **待审批（SUBMITTED）**。
2. **点开详情**：调度员看到来源仓库（含启停用状态与停用原因）、接收避难点、每个物资行的申请量/可用量/缺口/出库后剩余与安全库存，以及该仓全部批次的**剩余量、到期日、临期/过期状态**。
3. **批准（FEFO）**：批准时系统逐行按到期日升序分配——**先出临期批次，再出后续批次**，并把「批次 → 数量 → 顺序」冻结到单据；过期与隔离批次不参与分配，但计入缺口说明。
4. **库存不足**：任何物资可用批次量不足即为硬拦截，**单据保持待审批**，缺口数量与被排除的过期/隔离量写入单据的「待审拦截原因」，列表用「缺口/停用」标记。
5. **低于安全库存**：出库后某物资剩余将低于安全库存时为软预警，**必须填写强制出库原因**（不少于 5 个字），原因永久留在详情与时间线里。
6. **仓库停用**：停用仓库必须登记原因；停用期间该仓所有待审批单被硬拦截，拦截说明带出停用原因。
7. **出库**：仓库员按冻结的 FEFO 快照逐批扣减 `remaining_quantity`，状态变为 **已出库（DISPATCHED）**；若批次剩余量已变化导致不足，退回重新审批。
8. **签收**：避难点确认数量批次，状态变为 **已签收（RECEIVED）**，签收人与备注写入记录。
9. **进度可追溯**：申请 → 校验未过 → 批准 → 出库 → 签收每一步都写入 `ApprovalTimeline`，列表状态、详情批次、时间线三处一致，切页/刷新不丢失。

### 角色权限（RBAC，右上角可切换）

| 角色 | 申报 | 批准/驳回 | 出库 | 签收 | 仓库启停用 |
|---|---|---|---|---|---|
| 街道管理员 STREET_ADMIN | ✅ | ✅ | ✅ | ✅ | ✅ |
| 仓库员 WAREHOUSE_KEEPER | ✅ | ❌ | ✅ | ❌ | ✅ |
| 审批员 DISPATCHER | ❌ | ✅ | ❌ | ✅ | ❌ |
| 只读观察员 OBSERVER | ❌ | ❌ | ❌ | ❌ | ❌ |

## 本地开发方式

```bash
# 前端（端口 20102，/api 与 /health 已配置代理到 21102）
cd frontend && npm install && npm run dev

# 后端（端口 21102，等价于容器内 8080）
cd backend && mvn spring-boot:run -Dspring-boot.run.arguments=--server.port=21102
```

端到端测试（依赖独立安装，不影响生产构建）：

```bash
cd frontend/e2e && npm install && npx playwright install chromium
npm run test:e2e   # 需先启动前端 20102 与后端 21102
```

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | Vue 3 + TypeScript + Vite + Pinia + Vue Router + Element Plus + ECharts |
| 后端 | Spring Boot 3 + Java 17（当前演示实现为进程内内存仓库 + 同构 FEFO 引擎；`database/init.sql` 提供完整 MySQL DDL，接入时打开 JPA/MyBatis 数据源即可） |
| 数据库 | MySQL 8.0（init.sql 含仓库/物资/批次/避难点/调拨单/行/批次分配快照/时间线/库存流水/审计日志） |
| 部署 | Docker Compose（frontend Nginx + backend + db，健康检查与命名卷） |

## 项目目录结构

```text
frontend/src/
├── api/                 # 按实体分文件，/api 优先 + 本地持久化回退
├── stores/              # Pinia：dispatchOrder / inventoryBatch / warehouse / shelter / supplyItem / session
├── types/               # DispatchOrder、DispatchLine、AllocationPlan(FEFO计划)、ApprovalTimeline 等
├── constants/           # 枚举、角色权限矩阵、错误码、错误消息、日志模板
├── constructors/        # 默认对象/申请表单/聚合构造器
├── components/common/   # StatusBadge、BatchTable、ApprovalTimeline、CapacityMeter、ExpireWarningList、RoleSwitcher
├── components/dispatch/ # RequestFormDialog、ApprovalDialog、DispatchDetailDrawer
├── hooks/               # useDispatchFlow（审批动作+RBAC）、useExpireWarning、usePagination
├── services/            # allocationEngine(FEFO)、dispatchWorkflow(状态机)、localGateway、persistence
├── pages/               # Dashboard / Warehouses / Shelters / Dispatch / Events
├── router/              # 路由与守卫
├── utils/formatters.ts  # 日期/到期天数/临期窗口/数字等混合格式化
└── mocks/seedData.ts    # 本地种子（日期相对今天生成，保证始终能看到临期/过期批次）

backend/src/main/java/com/generated/rescueStock/
├── routes/ controllers/ services/ models/ repositories/
├── services/AllocationEngine.java、DispatchWorkflowService.java   # 与前端同构的 FEFO 与状态机
├── middlewares/         # ErrorHandlerMiddleware（结构化错误）等
├── constants/ constructors/ utils/ types/ config/
```

## 环境变量说明

| 变量 | 说明 | 默认值 |
|---|---|---|
| `COMPOSE_PROJECT_NAME` | Compose 项目与容器名前缀 | `rescue-stock` |
| `FRONTEND_PORT` | 前端宿主机端口（容器内 80） | `20102` |
| `BACKEND_PORT` | 后端宿主机端口（容器内 8080） | `21102` |
| `DB_PORT` | MySQL 宿主机端口（容器内 3306） | `33060` |
| `DB_NAME / DB_USER / DB_PASSWORD / DB_ROOT_PASSWORD` | 数据库名与账号 | `app_db / app_user / app_password` |
| `JWT_SECRET` | JWT 密钥（生产请修改） | `local-dev-secret-change-me` |

## Docker 部署说明

- 根 `docker-compose.yml` 顶层 `name: rescue-stock`，不写 `version:`；所有服务使用带 `${COMPOSE_PROJECT_NAME:-rescue-stock}` 前缀的 `container_name`。
- 端口映射：前端 `${FRONTEND_PORT:-20102}:80`，后端 `${BACKEND_PORT:-21102}:8080`。
- `db` 配置 healthcheck；`backend` 通过 `depends_on: condition: service_healthy` 等待数据库，并提供 `/health`；前端 Nginx 反代 `/api/` 到 `http://backend:8080/`，SPA 使用 `try_files $uri $uri/ /index.html;`。
- 数据库使用命名卷 `db_data`，不绑定挂载，中文目录名下也能正常启动。
- 常见问题：端口占用改 `.env`；要恢复演示种子执行 `docker compose down -v`；前端始终只请求相对路径 `/api`，禁止硬编码 `localhost`。

## 枚举/常量出现位置清单

### DispatchStatus（DRAFT / SUBMITTED / APPROVED / DISPATCHED / RECEIVED / REJECTED）

- 前端常量：`frontend/src/constants/DispatchStatus.ts`（文案、步骤分组、步骤数、筛选项）
- 前端类型：`types/DispatchOrder.ts`、`types/ApprovalTimeline.ts`
- 业务逻辑：`services/allocationEngine.ts`、`services/dispatchWorkflow.ts`（状态机断言）、`hooks/useDispatchFlow.ts`
- 构造器：`constructors/DispatchOrderConstructor.ts`
- 日志/错误：`constants/logTemplates.ts`（时间线文案）、`constants/errorMessages.ts`
- 展示/筛选：`components/common/StatusBadge.vue`、`ApprovalTimeline.vue`、`pages/DispatchPage.vue`（状态筛选 tabs）、`DashboardPage.vue`（进度条）、`EventsPage.vue`
- 后端：`constants/DispatchStatus.java`、`models/DispatchOrderAggregate.java`、`services/DispatchWorkflowService.java`、`controllers/DispatchOrderController.java`、`database/init.sql`

### SupplyCategory（FOOD / WATER / MEDICAL / SHELTER / RESCUE_TOOL）

- 前端常量：`constants/SupplyCategory.ts`（文案 + 筛选）、`constants/businessEnums.ts`（单位提示）
- 前端类型：`types/SupplyItem.ts`
- 构造器：`constructors/SupplyItemConstructor.ts`
- 展示/筛选：`StatusBadge.vue`、`RequestFormDialog.vue`、`WarehousesPage.vue`、`mocks/seedData.ts`
- 汇总：`constants/statusText.ts`；后端：`constants/SupplyCategory.java`、`models/SupplyItem.java`、`database/init.sql`

### ShelterStatus（CLOSED / STANDBY / OPEN / FULL）

- 前端常量：`constants/ShelterStatus.ts`；类型：`types/Shelter.ts`
- 构造器：`constructors/ShelterConstructor.ts`
- 展示：`StatusBadge.vue`、`CapacityMeter.vue`、`pages/SheltersPage.vue`、`mocks/seedData.ts`
- 汇总：`constants/statusText.ts`；后端：`constants/ShelterStatus.java`、`models/Shelter.java`、`database/init.sql`

### 调拨相关业务枚举（同一文件多值，分散引用）

`constants/businessEnums.ts` 集中定义并在多层引用：`DispatchPriority`（URGENT/HIGH/NORMAL，列表排序、徽标、事件聚合）、`WarehouseStatus`（ACTIVE/DISABLED，停用拦截、仓库页按钮）、`QualityStatus`（QUALIFIED/NEAR_EXPIRY/EXPIRED/QUARANTINED，FEFO 过滤、批次徽标、缺口排除说明）、`ShelterRiskLevel`。新增取值需同步：常量、类型、`statusText`、`StatusBadge` 配色、FEFO 引擎过滤、种子数据、后端枚举与 `init.sql`。

## 为什么该项目会牵一发动全身

- FEFO 口径同时存在于前端 `allocationEngine.ts` 与后端 `AllocationEngine.java`，并被 `BatchTable`、审批弹窗、详情抽屉、时间线四处共享展示；改排序规则就要同时改两端与测试。
- 调拨状态机 `SUBMITTED→APPROVED→DISPATCHED→RECEIVED`（含 REJECTED 旁路与「库存不足保持待审」回退）散落在枚举、hooks、store、API、工作流服务、控制器、时间线文案、列表筛选和 README。
- 「临期 30 天窗口」定义在 `utils/formatters.ts`，被批次质量判定、`useExpireWarning`、FEFO `near_expiry` 快照、大屏临期列表共同依赖。
- 错误码/错误消息/日志模板独立成文件且被 service、controller、store、组件按钮显隐多层引用；新增一个拦截原因必须同步 `errorCodes`、`errorMessages`、`logTemplates`、工作流与 UI 提示。
- 每个实体都有独立 constructor/factory；页面与 store 不得散写默认结构，新增字段要改类型、构造器、种子、SQL、前后端模型与详情展示。

## License

MIT
