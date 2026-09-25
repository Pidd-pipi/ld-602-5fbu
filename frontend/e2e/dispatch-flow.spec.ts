import { chromium, type Page } from "playwright";

const BASE = "http://localhost:20102";
let failures = 0;
const check = (cond: boolean, msg: string) => {
  if (cond) console.log("PASS:", msg);
  else { failures++; console.log("FAIL:", msg); }
};

const page: Page = await chromium.launch({ headless: true }).then((b) => b.newPage());
const errors: string[] = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });

// 1. 大屏
await page.goto(`${BASE}/dashboard`);
await page.waitForTimeout(1200);
check(await page.locator("h1").innerText() === "应急态势大屏", "大屏标题渲染");
check(await page.locator(".stat").count() >= 4, "大屏统计卡片渲染");

// 2. 调拨审批列表（切换街道管理员，具备申请/审批/出库/签收全部权限）
await page.goto(`${BASE}/dispatch`);
await page.waitForTimeout(800);
await page.selectOption(".role-switcher select", "STREET_ADMIN");
await page.waitForTimeout(400);
const rows = page.locator(".dispatch-table tbody tr");
check((await rows.count()) >= 3, `待审列表有数据（${await rows.count()} 行）`);
check(await page.getByText("DB-20260925-001").isVisible(), "单1 在列表中");
check(await page.getByText("缺口/停用").first().isVisible(), "列表显示缺口/停用拦截标记");

// 3. 打开单1详情，检查仓库/批次/到期日/安全库存
await page.getByText("DB-20260925-001").click();
await page.waitForTimeout(500);
check(await page.locator(".drawer").isVisible(), "详情抽屉打开");
check(await page.getByText("城东应急中心仓").first().isVisible(), "显示来源仓库");
check((await page.getByText(/安全 100/).count()) > 0, "显示安全库存");
check((await page.locator(".batch-table tr").count()) > 2, "批次表格含批次行");
check(await page.getByText(/还剩 12 天|还剩 11 天|还剩 13 天/).first().isVisible(), "显示到期日临期天数");

// 4. 打开审批弹窗：FEFO 顺序 + 安全库存预警 + 必须填原因
await page.getByRole("button", { name: /打开审批/ }).click();
await page.waitForTimeout(500);
check(await page.locator(".dialog-approve").isVisible(), "审批弹窗打开");
check(await page.getByText(/强制出库预警/).isVisible(), "提示低于安全库存预警");
const fefo1 = page.locator(".fefo-no").first();
check((await fefo1.innerText()) === "1", "FEFO 出库顺序从 1 开始");
check(await page.getByText("W1-WATER-2406").first().isVisible(), "临期批次排在计划中");
// 不填原因时批准按钮禁用
const approveBtn = page.getByRole("button", { name: /确认批准并记录原因/ });
check(await approveBtn.isDisabled(), "未填原因时批准按钮禁用");
await page.locator(".force-reason textarea").fill("防汛二级响应急需，经区应急局同意先发，48小时内补库");
check(await approveBtn.isEnabled(), "填写原因后批准可点击");
await approveBtn.click();
await page.waitForTimeout(1000);

// 5. 批准后状态变为已批准，抽屉显示出库按钮
check(await page.getByText("已批准").first().isVisible(), "状态显示已批准");
check(await page.getByRole("button", { name: /确认出库/ }).isVisible(), "出现出库按钮");

// 6. 出库
await page.getByRole("button", { name: /确认出库/ }).click();
await page.waitForTimeout(1000);
check(await page.getByText("已出库").first().isVisible(), "状态显示已出库");
check(await page.getByRole("button", { name: /确认签收/ }).isVisible(), "出现签收按钮");

// 6b. RBAC：切到审批员（只审批不出库），出库按钮隐藏，签收按钮仍可见
await page.selectOption(".role-switcher select", "DISPATCHER");
await page.waitForTimeout(400);
check(!(await page.getByRole("button", { name: /确认出库/ }).count()), "审批员看不到出库按钮（RBAC）");
check(await page.getByRole("button", { name: /确认签收/ }).isVisible(), "审批员可以执行签收");
await page.selectOption(".role-switcher select", "STREET_ADMIN");
await page.waitForTimeout(300);

// 7. 签收
await page.locator(".actions-card textarea").fill("数量批次核对无误");
await page.getByRole("button", { name: /确认签收/ }).click();
await page.waitForTimeout(1000);
check(await page.getByText("已签收").first().isVisible(), "状态显示已签收");
check(await page.getByText("避难点签收").first().isVisible(), "时间线含签收记录");

// 8. 刷新页面，进度仍在（切到“已签收”筛选找到单1）
await page.reload();
await page.waitForTimeout(1200);
await page.getByRole("button", { name: "已签收" }).click();
await page.waitForTimeout(400);
await page.getByText("DB-20260925-001").click();
await page.waitForTimeout(500);
check(await page.getByText("已签收").first().isVisible(), "刷新后仍为已签收（进度持久化）");
check((await page.locator(".timeline-item").count()) >= 4, "刷新后时间线完整");

// 9. 切换到缺口单2：保持待审 + 缺口文案
await page.goto(`${BASE}/dispatch`);
await page.waitForTimeout(1000);
await page.getByText("DB-20260925-002").click();
await page.waitForTimeout(500);
check(await page.getByText(/缺口 40/).first().isVisible(), "详情列出缺口 40");
check(await page.getByText(/已过期批次 50/).isVisible(), "缺口说明含过期批次不可用");

// 10. 仓库页显示停用原因
await page.goto(`${BASE}/warehouses`);
await page.waitForTimeout(1000);
check(await page.getByText("停用该仓库").isVisible(), "仓库页有停用按钮（审批员角色可能不可见，切换管理员）");

// 11. 切换为只读观察员 -> 审批按钮隐藏
await page.selectOption(".role-switcher select", "OBSERVER");
await page.goto(`${BASE}/dispatch`);
await page.waitForTimeout(1000);
await page.getByText("DB-20260925-002").click();
await page.waitForTimeout(400);
check(!(await page.getByRole("button", { name: /打开审批/ }).count()), "只读角色看不到审批按钮");

console.log(`\n控制台错误: ${errors.length}`);
errors.slice(0, 10).forEach((e) => console.log("  CONSOLE:", e.slice(0, 200)));
console.log(failures === 0 ? "\n全部 E2E 断言通过" : `\n${failures} 项失败`);
process.exit(failures ? 1 : 0);
