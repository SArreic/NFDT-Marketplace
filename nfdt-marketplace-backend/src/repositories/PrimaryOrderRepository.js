// src/repositories/PrimaryOrderRepository.js
const db = require('../database/db');

class PrimaryOrderRepository {
  async create(order) {
    const [created] = await db('primary_orders')
      .insert(order)
      .returning('*');
    return created;
  }

  async findById(id) {
    return db('primary_orders').where({ id }).first();
  }

  async findByBuyer(buyer_address) {
    return db('primary_orders')
      .where({ buyer_address })
      .orderBy('created_at', 'desc');
  }

  async updateStatus(id, status, extra = {}) {
    const [updated] = await db('primary_orders')
      .where({ id })
      .update({ status, ...extra })
      .returning('*');
    return updated;
  }
}

module.exports = new PrimaryOrderRepository();
