// src/repositories/SettlementReceiptRepository.js
const db = require('../database/db');

class SettlementReceiptRepository {
  async create(data) {
    const [receipt] = await db('settlement_receipts')
      .insert(data)
      .returning('*');
    return receipt;
  }

  async findByTrade(trade_id) {
    return db('settlement_receipts')
      .where({ trade_id })
      .orderBy('timestamp', 'asc');
  }

  async updateStatus(id, status, extra = {}) {
    const [updated] = await db('settlement_receipts')
      .where({ id })
      .update({ status, ...extra })
      .returning('*');
    return updated;
  }
}

module.exports = new SettlementReceiptRepository();
