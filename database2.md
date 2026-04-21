

## 交易系统与核心模块业务逻辑详解

### 一、整体业务定位

NFDT Marketplace 是一个 **RWA（现实世界资产）代币化交易平台**，其核心业务围绕"**资产代币化 → 一级发行 → 二级OTC交易 → 链上结算**"这条链路展开。整个平台存在 **两个交易市场 + 一套合规体系**：

```
底层资产 (assets)
     │
     ▼
代币化挂牌 (token_listings)
     │
     ├──────────────────────┐
     ▼                      ▼
一级市场 (Primary)      二级市场 (OTC)
  primary_orders          otc_offers / wanted_requests
     │                          │
     └──────────┬───────────────┘
                ▼
        统一结算 (settlement_receipts)
                │
                ▼
        链上交易 (Web3 / 智能合约)
                │
                ▼
        审计日志 (trade_history)
```

---

### 二、资产模块（assets）

**业务逻辑**：资产是整个平台的起点。任何在平台上交易的代币都必须先有对应的底层实物资产。

**核心字段含义**：

| 字段 | 含义 |
|------|------|
| `neo_contract_address` | 该资产在 Neo（或其他链）上的合约地址，用于链上资产确权 |
| `owner_address` | 资产法理上的链上所有者（通常是发行方/项目方） |
| `metadata_uri` | 链上存储的资产元数据 URI（包含资产的额外属性、图片等） |
| `type` | 资产类别（`green_energy` / `real_estate` / `vehicle` 等），影响ESG评分维度 |

**业务流程**：资产先在链下数据库录入（name、type、description），再通过外部系统（如项目方）将资产映射到链上合约（`neo_contract_address`），完成代币化。

---

### 三、上市模块（token_listings）— 最核心的业务中枢

**业务流程（状态机）**：

```
DRAFT（草稿）
   │  admin 填写基础信息（价格、数量、ESG 等）
   ▼
PENDING_REVIEW（待审核）
   │  提交平台审核（KYC 合规检查 + ESG 真实性核验）
   ▼
APPROVED（已批准）
   │  审核通过，等待排期上市
   ▼
LISTED（已上市）
   │  正式开放一级申购 / OTC 交易
   ▼
SUSPENDED（暂停）/ DELISTED（下架）
```

**investor_eligibility 合规规则**（JSONB 字段，代码中硬编码了一个示例）：

```js
{
  min_kyc_tier: 2,           // 最低 KYC 等级（防洗钱/恐怖融资）
  accredited_investor_only: false, // 是否仅限合格投资者
  allowed_countries: ['SG', 'HK'], // 允许交易的国籍/地区白名单
  min_investment_usd: '1000.00',   // 单笔最小投资金额
  max_investment_usd: '100000.00'  // 单笔最大投资金额
}
```

**ESG 评分体系**（用于帮助投资者评估资产可持续性）：

```js
{
  environmental: 9.0,  // 环境评分（碳排放、绿色能源占比等）
  social: 8.0,         // 社会评分（社区影响、就业等）
  governance: 8.5      // 治理评分（透明度、管理结构等）
}
// 综合 esg_score = 8.5（加权平均）
```

**挂牌类型**：`listing_type` 区分两种模式：
- `ENTITY`：整体资产作为一个单位挂牌（单一大型资产）
- `SHARES`：将资产拆分为若干份额代币挂牌（可分割所有权）

---

### 四、一级市场交易（Primary Trade）— 首次发行

**业务流程（状态机）**：

```
用户下单
    │
    ▼
PENDING_PAYMENT（等待付款）
    │  用户发起申购 → 系统计算总价 = quantity × price_per_share
    │  生成订单记录，买方将法币/USDT/USDC 打入平台托管账户
    ▼
PAID（已付款）
    │  平台确认收到用户付款（payment_tx_hash 记录法币链上转账）
    │  触发链上结算流程（Web3Service 调用合约）
    ▼
SETTLING（结算中）
    │  智能合约执行：MINT 新代币 → 将代币转入用户钱包
    │  settlement_tx_hash 记录链上铸币/转账交易哈希
    ▼
SETTLED（已完成）
    │  代币成功到账 → 同时写入 trade_history（PRIMARY 类型）
    │  同时写入 settlement_receipts（MINT 事件）
    ▼
若任何步骤失败 → FAILED（失败）
```

**核心校验规则**（从表结构和 seed 数据推断）：

1. **数量校验**：用户申购数量 ≤ `tokens_for_sale`（剩余可售数量）
2. **余额校验**：平台托管账户须有足够法币/USDT 接收用户付款
3. **合规校验**：申购前需验证用户 KYC 等级、国家、是否为合格投资者
4. **价格校验**：申购价格必须等于挂牌时的 `price_per_token`（不支持议价）

---

### 五、OTC 二级市场交易 — 用户间自由撮合

**OTC 挂单流程（otc_offers）**：

```
持币用户发起挂单
    │
    ▼
ACTIVE（挂单中）
    │  卖方设置：quantity（数量）、min_price_per_share（最低接受单价）
    │  卖方必须是该资产代币的持有者
    │  挂单期间代币由平台托管（或由智能合约锁仓）
    ▼
FILLED（全部成交）
    │  一个或多个买方接受挂单 → 成交
    ▼
CANCELLED（撤销）
    │  卖方主动撤销未成交部分
```

**OTC 撮合流程（otc_trades）**：

```
买方接受 ACTIVE 挂单
    │
    ▼
otc_trades 记录成交
    │  buyer_address / seller_address / quantity / price_per_share / total_price
    │  双向链上交易：
    │    payment_tx_hash   → 买方付款（USDT/USDC）的链上记录
    │    token_tx_hash     → 卖方转出代币的链上记录
    ▼
同时写入：
    - trade_history（OTC 类型）
    - settlement_receipts（TRANSFER 事件）
```

**OTC 特点**：与一级市场不同，OTC 是用户之间"**做市**"，价格可以由卖方自己设定（`min_price_per_share`），买方可以选择接受或寻找更低价的挂单。

---

### 六、求购意向模块（wanted_requests）— 买盘机制

这是二级市场"**买方主动表达意向**"的模块，与 OTC 挂单（卖方发起的卖盘）互为镜像：

| 字段 | 含义 |
|------|------|
| `desired_quantity` | 希望购买的数量 |
| `max_price_per_share` | 最高愿意接受的单价（保护买方） |
| `status: OPEN` | 挂出中，等待匹配 |
| `status: MATCHED` | 已与某个 OTC 挂单撮合成功 |
| `status: CANCELLED` | 买方撤销 |

**匹配逻辑（推测）**：系统定时任务或事件监听器扫描所有 `OPEN` 的 wanted_request，与 `ACTIVE` 的 otc_offer 按 `desired_quantity ≤ offer.quantity` 且 `max_price_per_share ≥ min_price_per_share` 的条件进行撮合。

---

### 七、结算体系（settlement_receipts）— 链上最终确认

结算服务是整个交易流程的**最后一环**，负责把链下记录的交易"落实"到区块链上：

| 事件类型 | 触发时机 | 说明 |
|---------|---------|------|
| `MINT` | 一级市场申购完成 | 智能合约铸造新代币，发放给申购者 |
| `TRANSFER` | OTC 二手交易完成 | 卖方已有代币过户给买方（非新铸币） |
| `ATOMIC_SWAP` | 可能的跨链原子交换 | 理想情况下资金和代币同时交换 |

每条结算记录包含 `tx_hash`（链上交易哈希）和 `block_number`（区块高度），作为不可篡改的**合规凭证**。

---

### 八、审计日志（trade_history）— 全量交易追溯

**重要设计**：无论是一级市场还是 OTC，每一笔链上结算完成后都会**同步写入 trade_history**，形成完整的交易审计链：

```
trade_history 每条记录 =
  asset_id（哪个资产）
  + buyer_address / seller_address（双方）
  + quantity + price（成交明细）
  + trade_type（PRIMARY / OTC）
  + tx_hash（链上凭证）
  + timestamp（时间戳）
```

这使得平台可以：
- 重建任意资产的完整交易历史
- 为监管机构提供可查的 AML/KYC 审计报告
- 计算任意时间段的交易量/GMV

---

### 九、合规安全体系

贯穿整个平台的合规检查点：

| 检查环节 | 检查内容 |
|---------|---------|
| 申购/接受挂单前 | 投资者 KYC 等级 ≥ `min_kyc_tier` |
| 申购/接受挂单前 | 投资者国籍在 `allowed_countries` 白名单中 |
| 申购/接受挂单前 | 单笔投资金额在 `min/max_investment_usd` 范围内 |
| 挂单创建前 | 卖方持有足够的代币余额 |
| 结算完成后 | ESG 评分作为公开信息供投资者参考 |
| 监管 | `regulatory_disclosures` 文件清单（招股说明书、审计报告等） |

---

### 十、当前模块实现状态总结

| 模块 | 状态 | 说明 |
|------|------|------|
| assets | ✅ 表结构完成 | 基础数据层 |
| token_listings | ✅ 表结构 + Repository + Controller 完成 | 核心在库 |
| primary_orders | ✅ 表结构完成 | 业务逻辑（Service/Controller）仍为空 |
| otc_offers / otc_trades | ✅ 表结构完成 | 业务逻辑仍为空 |
| wanted_requests | ✅ 表结构完成 | 业务逻辑仍为空 |
| settlement_receipts | ✅ 表结构完成 | 业务逻辑仍为空 |
| trade_history | ✅ 表结构完成 | 业务逻辑仍为空 |
| Web3Service / PaymentService | ⚠️ 文件为空 | 链上交互未实现 |
| auth / errorHandler | ✅ 中间件完成 | JWT 鉴权 + 全局错误处理 |

整体来看，**数据库模型层是完整的**，但**业务逻辑层（Service 层）全部为占位文件**，这是该项目当前最明显的开发缺口——一旦 Service 层被实现，整个交易流程就能真正跑通。