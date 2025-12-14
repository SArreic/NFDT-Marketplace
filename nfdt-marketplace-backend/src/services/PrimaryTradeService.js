// src/services/PrimaryTradeService.js

const db = require('../database/db');

const TokenListingRepository = require('../repositories/TokenListingRepository');
const PrimaryOrderRepository = require('../repositories/PrimaryOrderRepository');
const TradeHistoryRepository = require('../repositories/TradeHistoryRepository');

class PrimaryTradeService {
  /**
   * 一级市场购买入口
   * 用于：POST /api/v1/primary/buy
   */
  async buy(payload, user) {
    const {
      listing_id,
      quantity
    } = payload;

    // 1. 基础校验
    if (!user || !user.wallet_address) {
      const err = new Error('Unauthorized');
      err.statusCode = 401;
      throw err;
    }

    if (!listing_id || !quantity || Number(quantity) <= 0) {
      const err = new Error('Invalid purchase parameters');
      err.statusCode = 400;
      throw err;
    }

    // 2. 开启数据库事务（极其重要）
    return db.transaction(async trx => {
      // 3. 查询 listing（加锁，防止并发超卖）
      const listing = await trx('token_listings')
        .where({ id: listing_id })
        .forUpdate()
        .first();

      if (!listing) {
        const err = new Error('Listing not found');
        err.statusCode = 404;
        throw err;
      }

      if (listing.status !== 'LISTED' || !listing.is_active) {
        const err = new Error('Listing is not available for purchase');
        err.statusCode = 400;
        throw err;
      }

      if (Number(listing.remaining_shares) < Number(quantity)) {
        const err = new Error('Insufficient shares available');
        err.statusCode = 400;
        throw err;
      }

      // 4. 计算价格
      const pricePerShare = Number(listing.price_per_token);
      const totalPrice = pricePerShare * Number(quantity);

      // 5. 创建 PrimaryOrder
      const [order] = await trx('primary_orders')
        .insert({
          asset_id: listing.asset_id,
          listing_id,
          buyer_address: user.wallet_address,
          quantity,
          price_per_share: pricePerShare,
          total_price: totalPrice,
          status: 'PENDING_PAYMENT'
        })
        .returning('*');

      // 6. 锁定份额（扣减 remaining_shares）
      await trx('token_listings')
        .where({ id: listing_id })
        .update({
          remaining_shares: Number(listing.remaining_shares) - Number(quantity)
        });

      /**
       * 7. 这里是支付 & 链上结算的占位
       * 现在先假设支付成功
       * 后续可拆为：
       * - PaymentService
       * - SettlementService
       */

      // 模拟支付成功
      await trx('primary_orders')
        .where({ id: order.id })
        .update({
          status: 'PAID'
        });

      // 模拟结算成功
      await trx('primary_orders')
        .where({ id: order.id })
        .update({
          status: 'SETTLED'
        });

      // 8. 写入统一交易历史
      await trx('trade_history').insert({
        asset_id: listing.asset_id,
        buyer_address: user.wallet_address,
        seller_address: null, // Primary market 没有 seller
        quantity,
        price: pricePerShare,
        trade_type: 'PRIMARY'
      });

      return {
        order_id: order.id,
        status: 'SETTLED',
        quantity,
        total_price: totalPrice
      };
    });
  }
}

module.exports = new PrimaryTradeService();
