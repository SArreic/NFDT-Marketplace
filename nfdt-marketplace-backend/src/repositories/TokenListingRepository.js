// src/repositories/TokenListingRepository.js
const db = require('../database/db');

class TokenListingRepository {
  async create(data) {
    const [listing] = await db('token_listings')
      .insert({
        ...data,
        investor_eligibility: JSON.stringify(data.investor_eligibility || {}),
        esg_details: JSON.stringify(data.esg_details || {})
      })
      .returning('*');
    return listing;
  }

  async findById(id) {
    return db('token_listings').where({ id }).first();
  }

  async findAll(filters = {}, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    let query = db('token_listings');

    if (filters.status) query.where('status', filters.status);
    if (filters.listing_type) query.where('listing_type', filters.listing_type);
    if (filters.asset_id) query.where('asset_id', filters.asset_id);

    const [data, total] = await Promise.all([
      query.clone()
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset(offset),
      query.clone().count('* as total').first()
    ]);

    return {
      data,
      pagination: {
        total: Number(total.total),
        page,
        limit,
        totalPages: Math.ceil(Number(total.total) / limit)
      }
    };
  }

  async update(id, updates) {
    const data = { ...updates };
    if (data.investor_eligibility) {
      data.investor_eligibility = JSON.stringify(data.investor_eligibility);
    }
    if (data.esg_details) {
      data.esg_details = JSON.stringify(data.esg_details);
    }

    const [updated] = await db('token_listings')
      .where({ id })
      .update(data)
      .returning('*');
    return updated;
  }

  async delete(id) {
    return db('token_listings').where({ id }).delete();
  }
}

module.exports = new TokenListingRepository();
