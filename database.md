
## NFDT Marketplace 项目结构分析

### 一、项目定位

**NFDT Marketplace** 是一个 **RWA（现实世界资产）代币化交易平台**的后端系统，核心目标是将实物资产（如太阳能农场、房地产等）进行代币化，并在合规框架下提供一级发行和二级 OTC 交易功能。

**技术栈**：`Node.js + Express 5` / `Knex.js` / `PostgreSQL` / `Web3.js` / `Jest` + `Supertest`

---

### 二、模块架构（分层）

```
nfdt-marketplace-backend/
├── src/
│   ├── routes/          # 路由层（路由分发）
│   │   ├── index.js
│   │   ├── listings.js      ✅ 有内容
│   │   ├── otc.routes.js    ⚠️ 空文件
│   │   ├── primary.routes.js # ⚠️ 空文件
│   │   └── dashboard.routes.js # ⚠️ 空文件
│   │
│   ├── controllers/    # 控制器层（请求处理）
│   │   ├── ListingsController.js     ✅ 有内容
│   │   ├── OtcTradeController.js      ⚠️ 空文件
│   │   ├── PrimaryTradeController.js  # ⚠️ 空文件
│   │   └── DashboardController.js     # ⚠️ 空文件
│   │
│   ├── services/        # 业务逻辑层（所有为空——占位符）
│   │   ├── ListingService.js
│   │   ├── OtcTradeService.js
│   │   ├── PrimaryTradeService.js
│   │   ├── SettlementService.js
│   │   ├── PaymentService.js
│   │   └── Web3Service.js
│   │
│   ├── repositories/   # 数据访问层
│   │   ├── TokenListingRepository.js  ✅ 有内容
│   │   ├── AssetRepository.js         ⚠️ 空文件
│   │   ├── OtcOfferRepository.js      ⚠️ 空文件
│   │   ├── OtcTradeRepository.js      ⚠️ 空文件
│   │   └── TradeRepository.js         ⚠️ 空文件
│   │
│   ├── database/       # 数据库层
│   │   ├── db.js       ✅ 有内容（Knex 实例）
│   │   └── migrations/ ✅ 8个迁移文件均有完整内容
│   │
│   ├── middlewares/    # 中间件
│   │   ├── auth.js           ✅ 有内容（JWT 认证）
│   │   ├── adminGuard.js     ⚠️ 空文件
│   │   └── errorHandler.js   ✅ 有内容（全局错误处理）
│   │
│   ├── validators/     # 参数校验
│   │   ├── listing.validator.js
│   │   ├── otc.validator.js
│   │   └── primary.validator.js
│   │
│   ├── config/         # 配置
│   │   ├── db.js       ✅ 有内容
│   │   ├── web3.js     ✅ 有内容（Web3 + WalletConnect）
│   │   ├── constants.js ✅ 有内容
│   │   └── index.js
│   │
│   ├── common/         # 公共工具
│   │   ├── ApiError.js
│   │   ├── ApiResponse.js
│   │   └── enums.js
│   │
│   ├── utils/          # 工具函数
│   │   ├── logger.js
│   │   ├── pagination.js
│   │   └── response.js
│   │
│   ├── app.js          ✅ Express 应用入口
│   └── server.js
│
└── knexfile.js          ✅ Knex 配置（dev/staging/prod 三环境）
```

**结论**：项目采用了 **Controller → Repository → Database** 的经典三层架构（Service 层目前全部为占位符），但 **数据库迁移层是最完整、最核心的业务载体**，已经定义了所有核心表结构。

---

### 三、核心模块与数据库表详解

项目共有 **8 张核心数据表**，按业务重要性排列如下：

---

#### ① `assets`（资产库）— 最底层实体

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `UUID` (PK) | 主键 |
| `name` | `string` | 资产名称（如 "Singapore Solar Farm #1"） |
| `type` | `string` | 资产类型（`real_estate` / `green_energy` / `vehicle` 等） |
| `description` | `text` | 资产详细描述 |
| `metadata_uri` | `string` | 链上元数据 URI |
| `neo_contract_address` | `string` | Neo 合约地址 |
| `owner_address` | `string` | 链上所有者地址 |
| `created_at` | `timestamp` | 创建时间 |
| `updated_at` | `timestamp` | 更新时间 |

**职责**：存储所有代币化底层资产的原始信息，是整个系统的根基。所有 `token_listings` 等都外键依赖它。

---

#### ② `token_listings`（代币上市）— 核心业务表

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `UUID` (PK) | 主键 |
| `asset_id` | `UUID` (FK→assets) | 关联资产 |
| `listing_type` | `enum` | 挂牌类型：`ENTITY`（实体）或 `SHARES`（份额） |
| `status` | `enum` | 生命周期状态：`DRAFT / PENDING_REVIEW / APPROVED / LISTED / SUSPENDED / DELISTED` |
| `seller_address` | `string` | 卖方区块链地址 |
| `total_supply` | `decimal(30,6)` | 代币总供给量 |
| `tokens_for_sale` | `decimal(30,6)` | 本次可售代币数量 |
| `remaining_shares` | `decimal(30,6)` | 剩余未售份额 |
| `price_per_token` | `decimal(30,6)` | 单个代币价格 |
| `min_price_per_share` | `decimal(30,6)` | 每股最低价（OTC 用） |
| `valuation_usd` | `decimal(30,6)` | 整体估值（USD） |
| `settlement_token` | `string` | 结算代币（默认 `USDT`） |
| `currency_address` | `string` | 结算代币合约地址（例：USDC `0xA0b...`） |
| `contract_address` | `string` | 代币合约地址 |
| `investor_eligibility` | `jsonb` | 投资者资格规则（KYC 等级、允许国家、最小/最大投资额） |
| `esg_score` | `integer` | ESG 综合评分（0-10） |
| `esg_details` | `jsonb` | ESG 明细（environmental / social / governance 分项） |
| `regulatory_disclosures` | `text[]` | 监管披露文件列表 |
| `listing_date` | `timestamp` | 上市日期 |
| `is_active` | `boolean` | 是否激活 |
| `created_at` / `updated_at` | `timestamp` | 时间戳 |

**职责**：这是系统**最核心的表**，连接资产与交易市场，承载了所有合规（KYC/ESG/地区限制）和定价信息。ListingsController 通过 `TokenListingRepository` 对该表进行 CRUD 操作。

---

#### ③ `primary_orders`（一级申购订单）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `UUID` (PK) | 主键 |
| `asset_id` | `UUID` (FK) | 关联资产 |
| `listing_id` | `UUID` (FK) | 关联上市 |
| `buyer_address` | `string` | 买方地址 |
| `quantity` | `decimal(30,6)` | 申购数量 |
| `price_per_share` | `decimal(30,6)` | 成交单价 |
| `total_price` | `decimal(30,6)` | 总价 |
| `status` | `enum` | 订单状态：`PENDING_PAYMENT / PAID / SETTLING / SETTLED / FAILED` |
| `payment_tx_hash` | `string` | 用户付款交易哈希 |
| `settlement_tx_hash` | `string` | 结算交易哈希（链上） |
| `created_at` / `updated_at` | `timestamp` | 时间戳 |

**职责**：记录**一级市场**（Primary Market）即资产首次发行时的用户申购行为，从下单 → 付款 → 链上结算的完整流程。

---

#### ④ `otc_offers`（OTC 挂单）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `UUID` (PK) | 主键 |
| `asset_id` | `UUID` (FK) | 关联资产 |
| `listing_id` | `UUID` (FK) | 关联上市 |
| `seller_address` | `string` | 卖方地址 |
| `quantity` | `decimal(30,6)` | 挂单数量 |
| `min_price_per_share` | `decimal(30,6)` | 每份最低接受价 |
| `settlement_token` | `string` | 结算代币（默认 USDT） |
| `status` | `enum` | 状态：`ACTIVE / FILLED / CANCELLED` |
| `created_at` / `updated_at` | `timestamp` | 时间戳 |

**职责**：用户（持币者）在**二级市场**发布自己的卖单，设定价格和数量，等待其他用户接受。

---

#### ⑤ `otc_trades`（OTC 成交记录）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `UUID` (PK) | 主键 |
| `offer_id` | `UUID` (FK→otc_offers) | 关联挂单 |
| `buyer_address` | `string` | 买方地址 |
| `seller_address` | `string` | 卖方地址 |
| `quantity` | `decimal(30,6)` | 成交数量 |
| `price_per_share` | `decimal(30,6)` | 成交单价 |
| `total_price` | `decimal(30,6)` | 成交总价 |
| `payment_tx_hash` | `string` | 付款链上交易哈希 |
| `token_tx_hash` | `string` | 代币转账链上交易哈希 |
| `created_at` | `timestamp` | 成交时间 |

**职责**：记录 OTC 撮合成功后的实际成交，包括双向的链上交易哈希，保证资金流和代币流可追溯。

---

#### ⑥ `trade_history`（全量交易历史 / 审计日志）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `UUID` (PK) | 主键 |
| `asset_id` | `UUID` (FK) | 关联资产 |
| `buyer_address` | `string` | 买方地址 |
| `seller_address` | `string` | 卖方地址 |
| `quantity` | `decimal(30,6)` | 成交数量 |
| `price` | `decimal(30,6)` | 成交单价 |
| `trade_type` | `enum` | 交易类型：`PRIMARY`（一级）或 `OTC`（二级） |
| `tx_hash` | `string` | 链上交易哈希 |
| `timestamp` | `timestamp` | 发生时间 |

**职责**：作为全系统的**统一交易审计日志**，无论一级还是二级交易完成后都会写入此表，用于事后审计和 Dashboard 统计。

---

#### ⑦ `settlement_receipts`（结算凭证）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `UUID` (PK) | 主键 |
| `trade_id` | `UUID` | 关联交易 ID（一级或 OTC） |
| `event_type` | `string` | 事件类型：`MINT / TRANSFER / ATOMIC_SWAP` |
| `tx_hash` | `string` | 链上结算交易哈希 |
| `block_number` | `integer` | 区块高度 |
| `status` | `enum` | 状态：`PENDING / SUCCESS / FAILED` |
| `timestamp` | `timestamp` | 结算时间 |

**职责**：记录链上结算的执行结果——代币铸造（MINT）、转账（TRANSFER）或原子交换（ATOMIC_SWAP），是合规审计的关键凭证。

---

#### ⑧ `wanted_requests`（求购意向）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `UUID` (PK) | 主键 |
| `asset_id` | `UUID` (FK) | 关联资产 |
| `buyer_address` | `string` | 求购方地址 |
| `desired_quantity` | `decimal(30,6)` | 期望购买数量 |
| `max_price_per_share` | `decimal(30,6)` | 最高接受单价 |
| `status` | `enum` | 状态：`OPEN / MATCHED / CANCELLED` |
| `created_at` / `updated_at` | `timestamp` | 时间戳 |

**职责**：用户发布对某个资产的**求购意向**（设置数量和最高心理价位），可与 OTC 挂单进行撮合，是二级市场"买盘"方的体现。

---

### 四、模块间关系（ER 简化图）

```
assets (1)
    └── token_listings (N) ─── primary_orders (N)
                          └── otc_offers (N) ──── otc_trades (N)
                          └── wanted_requests (N)

(全部交易写入) ──→ trade_history (审计日志)
(primary_orders + otc_trades) ──→ settlement_receipts (结算凭证)
```

---

### 五、业务流程总览

| 场景 | 流程路径 |
|------|---------|
| **资产上架** | `admin` → `ListingsController.createListing` → `TokenListingRepository` → `token_listings`（状态 PENDING_REVIEW） |
| **一级申购** | 用户申购 → `primary_orders`(PENDING_PAYMENT) → 付款 → `SETTLING` → 链上 MINT → `SETTLED` + `trade_history` + `settlement_receipts` |
| **OTC 挂单** | 持币用户发布 offer → `otc_offers`(ACTIVE)，等待买方 |
| **OTC 撮合** | 买方接受 offer → `otc_trades` 记录成交 + 双向链上交易 → `settlement_receipts` |
| **求购意向** | 用户发起 wanted_request → 可与 ACTIVE otc_offer 撮合 |

---

### 六、当前项目状态总结

| 层级 | 完成度 |
|------|--------|
| 数据库迁移（8张表） | **100%** — 所有表结构完整 |
| Repository 层 | **20%** — 仅 `TokenListingRepository` 有内容 |
| Controller 层 | **20%** — 仅 `ListingsController` 有内容 |
| Service 层 | **0%** — 全部为占位空文件 |
| Middleware（auth/errorHandler） | **部分完成** |
| Web3 集成 | **配置存在，Service 为空** |
| 测试 | **有骨架**（`__test__/`） |

该项目目前处于 **"数据库层先行，业务逻辑层逐步填充"** 的开发状态，核心数据模型已经非常完善，涵盖了 RWA 代币化交易平台的完整业务流程。