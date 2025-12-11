// src/models/TokenListing.js - 完善模型定义
/**
 * @typedef {Object} TokenListing
 * @property {string} id
 * @property {string} asset_id
 * @property {'DRAFT'|'PENDING_REVIEW'|'APPROVED'|'LISTED'|'SUSPENDED'|'DELISTED'} status
 * @property {string} total_supply
 * @property {string} tokens_for_sale
 * @property {string} price_per_token
 * @property {string} valuation_usd
 * @property {string} currency_address
 * @property {string|null} contract_address
 * @property {Object} investor_eligibility
 * @property {number|null} esg_score
 * @property {Object} esg_details
 * @property {string[]} regulatory_disclosures
 * @property {Date|null} listing_date
 * @property {Date} created_at
 * @property {Date} updated_at
 */

// src/repositories/TokenListingRepository.js - 完善Repository
const db = require('../database/db');

class TokenListingRepository {
  async findAll(filters = {}, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    let query = db('token_listings');
    
    // 应用过滤器
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
        total: parseInt(total.total),
        page,
        limit,
        totalPages: Math.ceil(parseInt(total.total) / limit)
      }
    };
  }
  
  async findById(id) {
    return db('token_listings')
      .where({ id })
      .first();
  }
  
  async create(listingData) {
    const [listing] = await db('token_listings')
      .insert({
        ...listingData,
        investor_eligibility: JSON.stringify(listingData.investor_eligibility || {}),
        esg_details: JSON.stringify(listingData.esg_details || {})
      })
      .returning('*');
    
    return listing;
  }
  
  async update(id, updates) {
    const data = { ...updates };
    
    // 处理JSON字段
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

module.exports = TokenListingRepository;