// src/services/ListingService.js

const TokenListingRepository = require('../repositories/TokenListingRepository');
const AssetRepository = require('../repositories/AssetRepository');

class ListingService {
  /**
   * 市场公开 listings
   * 用于：GET /api/v1/listings
   */
  async getMarketListings(query = {}) {
    const {
      page = 1,
      limit = 12,
      status = 'LISTED',
      minEsgScore,
      assetType,
      sortBy = 'newest'
    } = query;

    const filters = { status };

    if (minEsgScore) {
      filters.minEsgScore = Number(minEsgScore);
    }

    if (assetType) {
      filters.assetType = assetType;
    }

    // Repository 层负责 SQL & join
    return TokenListingRepository.findAll(
      filters,
      Number(page),
      Number(limit),
      sortBy
    );
  }

  /**
   * listing 详情（含 asset）
   * 用于：GET /api/v1/listings/:id
   */
  async getListingDetail(listingId) {
    const listing = await TokenListingRepository.findById(listingId);

    if (!listing) {
      const err = new Error('Listing not found');
      err.statusCode = 404;
      throw err;
    }

    const asset = await AssetRepository.findById(listing.asset_id);

    return {
      ...listing,
      asset,
      investor_eligibility: this._safeJson(listing.investor_eligibility),
      esg_details: this._safeJson(listing.esg_details)
    };
  }

  /**
   * Admin 创建 listing（上架申请）
   * 用于：POST /api/v1/admin/listings
   */
  async createListing(data, user) {
    this._assertAdmin(user);
    this._validateListingData(data);

    return TokenListingRepository.create({
      ...data,
      status: 'PENDING_REVIEW',
      listing_date: null
    });
  }

  /**
   * Admin 更新 listing
   * 用于：PUT /api/v1/admin/listings/:id
   */
  async updateListing(listingId, updates, user) {
    this._assertAdmin(user);

    const updated = await TokenListingRepository.update(listingId, updates);

    if (!updated) {
      const err = new Error('Listing not found');
      err.statusCode = 404;
      throw err;
    }

    return updated;
  }

  /**
   * Admin 删除 listing
   * 用于：DELETE /api/v1/admin/listings/:id
   */
  async deleteListing(listingId, user) {
    this._assertAdmin(user);
    await TokenListingRepository.delete(listingId);
  }

  /* ===========================
   * 内部工具函数（私有）
   * =========================== */

  _assertAdmin(user) {
    if (!user || user.role !== 'admin') {
      const err = new Error('Admin access required');
      err.statusCode = 403;
      throw err;
    }
  }

  _validateListingData(data) {
    const requiredFields = [
      'asset_id',
      'total_supply',
      'price_per_token',
      'valuation_usd'
    ];

    for (const field of requiredFields) {
      if (!data[field]) {
        const err = new Error(`Missing required field: ${field}`);
        err.statusCode = 400;
        throw err;
      }
    }

    if (data.investor_eligibility) {
      const elig = data.investor_eligibility;

      if (
        !elig.min_kyc_tier ||
        !Array.isArray(elig.allowed_countries)
      ) {
        const err = new Error('Invalid investor eligibility structure');
        err.statusCode = 400;
        throw err;
      }
    }
  }

  _safeJson(value) {
    if (!value) return null;
    if (typeof value === 'object') return value;
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
}

module.exports = new ListingService();
