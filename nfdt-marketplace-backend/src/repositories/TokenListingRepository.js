const db = require('../database/db');

class TokenListingRepository {
  async findAll(filters = {}, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    let query = db('token_listings');

    if (filters.status) query.where('status', filters.status);
    if (filters.minEsgScore) query.where('esg_score', '>=', filters.minEsgScore);
    if (filters.assetType) {
      query.join('assets', 'token_listings.asset_id', '=', 'assets.id')
           .where('assets.type', filters.assetType);
    }

    const [listings, total] = await Promise.all([
      query.clone()
        .select('token_listings.*')
        .orderBy('listing_date', 'desc')
        .limit(limit)
        .offset(offset),
      query.clone().count('* as total').first()
    ]);

    return {
      data: listings,
      pagination: {
        total: Number(total.total),
        page,
        limit,
        totalPages: Math.ceil(Number(total.total) / limit)
      }
    };
  }

  async findById(id) {
    return db('token_listings').where({ id }).first();
  }

  async create(listingData) {
    const insertData = {
      ...listingData,
      investor_eligibility: JSON.stringify(listingData.investor_eligibility || {}),
      esg_details: JSON.stringify(listingData.esg_details || {})
    };

    const [listing] = await db('token_listings')
      .insert(insertData)
      .returning('*');

    return listing;
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
