// src/repositories/TradeHistoryRepository.js
const db = require('../database/db');

class TradeHistoryRepository {
  async record(trade) {
    const [record] = await db('trade_history')
      .insert(trade)
      .returning('*');
    return record;
  }

  async findByAsset(asset_id) {
    return db('trade_history')
      .where({ asset_id })
      .orderBy('timestamp', 'desc');
  }

  async findByUser(wallet) {
    return db('trade_history')
      .where('buyer_address', wallet)
      .orWhere('seller_address', wallet)
      .orderBy('timestamp', 'desc');
  }
}

module.exports = new TradeHistoryRepository();
