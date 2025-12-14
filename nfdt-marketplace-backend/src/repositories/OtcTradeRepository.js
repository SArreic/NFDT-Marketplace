// src/repositories/OtcTradeRepository.js
const db = require('../database/db');

class OtcTradeRepository {
  async create(trade) {
    const [created] = await db('otc_trades')
      .insert(trade)
      .returning('*');
    return created;
  }

  async findByOffer(offer_id) {
    return db('otc_trades')
      .where({ offer_id })
      .orderBy('created_at', 'desc');
  }
}

module.exports = new OtcTradeRepository();
