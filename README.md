# 迷你银行 · 核心业务练习项目（Mini-Bank）

面向**银行科技 / 银行开发**应聘的本地可跑练习项目：用 NestJS + React 串起「客户 → 账户 → 存取转 → 贷款 → 流水 → 风控」最小闭环，代码里带中文业务注释，方便对照面试话术。

> 本项目为教学示意，**不是**真实银行核心系统；无清算、日切、会计科目表、监管报送等生产能力。

---

## 技术栈

| 端 | 技术 | 默认端口 |
|----|------|----------|
| 后端 | NestJS + TypeScript，JSON 文件持久化（`backend/data/bank.json`） | **3000** |
| 前端 | React + Vite + TypeScript，中文 UI | **5173** |

---

## 如何启动

### 1. 启动后端

```bash
cd /workspace/mini-bank/backend
npm i
npm run start:dev
```

看到日志：`迷你银行后端已启动: http://localhost:3000`  
健康检查：<http://localhost:3000/health>

### 2. 启动前端（另开终端）

```bash
cd /workspace/mini-bank/frontend
npm i
npm run dev
```

浏览器打开：<http://localhost:5173>  
开发模式通过 Vite 代理 `/api` → `http://localhost:3000`。

### 3. 示例操作步骤（种子数据）

启动后已有种子客户与账户：

| 客户 | 账号 | 类型 | 初始余额 |
|------|------|------|----------|
| 张三 | `6222000000000001` | 活期 | 10,000 |
| 张三 | `6222000000000002` | 定期 12 月 | 50,000 |
| 李四 | `6222000000000003` | 活期 | 8,000 |

建议路径：

1. 打开「客户账户」核对余额。
2. 「存取转账」：张三活期 → 李四账号 `6222000000000003` 转 500 元。
3. 「流水」：同一 `bizId` 应有转出 + 转入两笔。
4. 「贷款」：张三申请 20,000 → 审批 → 放款 → 还一部分。
5. 试错：超额转账、余额不足、自己转自己、定期取款，观察风控报错。
6. 首页可点「重置演示数据」恢复种子。

---

## 业务概念对照表（银行术语 ↔ 本项目）

| 银行术语 / 概念 | 本项目功能 | 说明 |
|-----------------|------------|------|
| CIF / 客户建档 | `POST /customers`、客户页「建档」 | 开户前建立客户主数据；证件号唯一 |
| 开户 / 存款产品 | `POST /accounts` | 活期 `CHECKING`、定期 `FIXED` |
| 余额查询 | `GET /accounts/:id/balance` | 账户列表页直接展示余额 |
| 存款（贷记客户账） | `POST /transactions/deposit` | 余额↑ + 流水 `DEPOSIT` |
| 取款（借记客户账） | `POST /transactions/withdraw` | 余额↓；限额 / 余额不足校验；定期禁取 |
| 同行转账 | `POST /transactions/transfer` | 付款↓ + 收款↑；共用 `bizId` |
| 借贷分录思路 | 转账成对流水 `TRANSFER_OUT` / `TRANSFER_IN` | 真实核心用会计分录保证借贷平衡 |
| 事务 / 回滚 | 变更前完整校验，失败不落盘 | 生产用数据库事务 |
| 贷款申请 | `POST /loans/apply` | 状态 `APPLIED` |
| 信贷审批 | `POST /loans/:id/approve` | ≤10 万自动通过，否则拒绝示意 |
| 放款 | `POST /loans/:id/disburse` | 本金入活期 + `LOAN_DISBURSE` 流水 |
| 还款 | `POST /loans/repay` | 扣活期、冲剩余本金；还清 → `SETTLED` |
| 交易流水 / 流水查询 | `GET /transactions` | 可按账户筛选 |
| 风控限额 | `GET /risk-rules` | 单笔转账/取款限额、禁自转等 |
| 负债 vs 资产 | 注释与 README | 客户存款=银行负债；贷款=银行资产 |

---

## 建议学习路径（面试向）

1. **先跑通演示**：按上面 6 步操作，建立业务体感。  
2. **读转账代码**：`backend/src/transactions/transactions.service.ts` 的 `transfer` —— 风控顺序、双边记账、`bizId`。  
3. **读贷款状态机**：`loans.service.ts` —— 申请→审批→放款→还款。  
4. **对照术语表**，用自己的话讲清：为什么转账要「要么都成功要么都失败」。  
5. **扩展练习（可选）**：日累计限额、冻结账户、利息试算、简易会计科目分录表。

---

## 后端模块结构

```
backend/src/
  customers/     # 客户建档
  accounts/      # 开户、余额
  transactions/  # 存取转账、流水
  loans/         # 贷款全流程
  store/         # 内存 + JSON 持久化、种子数据
  common/        # 风控常量
```

---

## API 一览

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/health` | 健康检查 |
| GET | `/risk-rules` | 查询风控规则 |
| POST | `/demo/reset` | 重置种子数据 |
| GET | `/customers` | 客户列表 |
| GET | `/customers/:id` | 客户详情 |
| POST | `/customers` | 建档 `{ name, idNumber, phone }` |
| GET | `/accounts?customerId=` | 账户列表 |
| GET | `/accounts/:id` | 账户详情 |
| GET | `/accounts/:id/balance` | 余额查询 |
| POST | `/accounts` | 开户 `{ customerId, type, initialDeposit, termMonths? }` |
| GET | `/transactions?accountId=` | 流水列表 |
| GET | `/transactions/biz/:bizId` | 按业务单号查成对流水 |
| POST | `/transactions/deposit` | 存款 `{ accountId, amount, remark? }` |
| POST | `/transactions/withdraw` | 取款 |
| POST | `/transactions/transfer` | 转账 `{ fromAccountId, toAccountNo, amount, remark? }` |
| GET | `/loans?customerId=` | 贷款列表 |
| GET | `/loans/:id` | 贷款详情 |
| POST | `/loans/apply` | 申请 `{ customerId, accountId, principal, termMonths }` |
| POST | `/loans/:id/approve` | 审批 |
| POST | `/loans/:id/disburse` | 放款 |
| POST | `/loans/repay` | 还款 `{ loanId, accountId, amount }` |

请求体需 `Content-Type: application/json`；校验失败返回 400 及中文 `message`。

### curl 示例

```bash
# 健康检查
curl http://localhost:3000/health

# 转账：张三 → 李四
curl -X POST http://localhost:3000/transactions/transfer \
  -H 'Content-Type: application/json' \
  -d '{"fromAccountId":"<张三活期账户id>","toAccountNo":"6222000000000003","amount":500}'
```

账户 `id` 可先 `curl http://localhost:3000/accounts` 查看。

---

## 风控规则（默认）

定义见 `backend/src/common/risk.constants.ts`：

- 单笔转账上限：50,000 元  
- 单笔取款上限：20,000 元  
- 贷款自动审批上限：100,000 元  
- 贷款最低金额：1,000 元  
- 默认年利率：4.5%（示意，还款未拆利息）  
- 禁止向自己同一账户转账；余额不足拒绝；定期禁取/禁转出  

---

## 前端页面

| 路由 | 页面 | 能力 |
|------|------|------|
| `/` | 首页 | 导航、风控摘要、重置演示数据 |
| `/customers` | 客户账户 | 建档、开户、列表与余额 |
| `/banking` | 存取转账 | 存款、取款、同行转账 |
| `/loans` | 贷款 | 申请、审批、放款、还款 |
| `/transactions` | 流水 | 全量/按账户筛选 |

---

## 常见问题

**Q: 改代码后数据乱了？**  
A: 首页点「重置演示数据」，或 `POST /demo/reset`，或删除 `backend/data/bank.json` 后重启后端。

**Q: 前端提示后端未连接？**  
A: 先确认后端在 3000 端口；前端必须用 `npm run dev`（依赖 Vite 代理）。

**Q: 为什么不用数据库？**  
A: 优先「好启动」。业务逻辑与模块划分已按可替换持久化方式组织，面试时可谈如何换成 PostgreSQL + 事务。
