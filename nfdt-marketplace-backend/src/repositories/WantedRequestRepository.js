// src/repositories/WantedRequestRepository.js
const db = require('../database/db');

class WantedRequestRepository {
  async create(data) {
    const [req] = await db('wanted_requests')
      .insert(data)
      .returning('*');
    return req;
  }

  async findOpenByAsset(asset_id) {
    return db('wanted_requests')
      .where({ asset_id, status: 'OPEN' })
      .orderBy('created_at', 'asc');
  }

  async updateStatus(id, status) {
    const [updated] = await db('wanted_requests')
      .where({ id })
      .update({ status })
      .returning('*');
    return updated;
  }
}

module.exports = new WantedRequestRepository();
