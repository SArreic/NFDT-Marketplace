// src/repositories/OtcOfferRepository.js
const db = require('../database/db');

class OtcOfferRepository {
  async create(data) {
    const [offer] = await db('otc_offers')
      .insert(data)
      .returning('*');
    return offer;
  }

  async findById(id) {
    return db('otc_offers').where({ id }).first();
  }

  async findActiveByAsset(asset_id) {
    return db('otc_offers')
      .where({ asset_id, status: 'ACTIVE' })
      .orderBy('created_at', 'asc');
  }

  async updateStatus(id, status) {
    const [updated] = await db('otc_offers')
      .where({ id })
      .update({ status })
      .returning('*');
    return updated;
  }
}

module.exports = new OtcOfferRepository();
