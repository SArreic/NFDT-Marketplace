// src/repositories/AssetRepository.js
const db = require('../database/db');

class AssetRepository {
  async create(data) {
    const [asset] = await db('assets')
      .insert(data)
      .returning('*');
    return asset;
  }

  async findById(id) {
    return db('assets').where({ id }).first();
  }

  async findAll({ type } = {}) {
    const query = db('assets');
    if (type) query.where('type', type);
    return query.orderBy('created_at', 'desc');
  }

  async update(id, updates) {
    const [updated] = await db('assets')
      .where({ id })
      .update(updates)
      .returning('*');
    return updated;
  }

  async delete(id) {
    return db('assets').where({ id }).delete();
  }
}

module.exports = new AssetRepository();
