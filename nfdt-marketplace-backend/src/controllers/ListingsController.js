// src/controllers/ListingsController.js
const TokenListingRepository = require('../repositories/TokenListingRepository');

class ListingsController {
  constructor() {
    this.repository = new TokenListingRepository();
  }
  
  // GET /api/v1/market/listings - 公开市场列表
  async getMarketListings(req, res) {
    try {
      const { 
        page = 1, 
        limit = 12, 
        status = 'LISTED',
        minEsgScore,
        assetType,
        sortBy = 'newest'
      } = req.query;
      
      const filters = { status };
      if (minEsgScore) filters.minEsgScore = parseFloat(minEsgScore);
      if (assetType) filters.assetType = assetType;
      
      const result = await this.repository.findAll(
        filters, 
        parseInt(page), 
        parseInt(limit)
      );
      
      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      console.error('Error fetching market listings:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch listings' 
      });
    }
  }
  
  // GET /api/v1/market/listings/:id - 代币详情
  async getListingDetail(req, res) {
    try {
      const { id } = req.params;
      const listing = await this.repository.findById(id);
      
      if (!listing) {
        return res.status(404).json({ 
          success: false, 
          error: 'Listing not found' 
        });
      }
      
      // 获取关联的资产信息
      const asset = await db('assets').where({ id: listing.asset_id }).first();
      
      res.json({
        success: true,
        data: {
          ...listing,
          asset,
          investor_eligibility: typeof listing.investor_eligibility === 'string' 
            ? JSON.parse(listing.investor_eligibility) 
            : listing.investor_eligibility,
          esg_details: typeof listing.esg_details === 'string'
            ? JSON.parse(listing.esg_details)
            : listing.esg_details
        }
      });
    } catch (error) {
      console.error('Error fetching listing detail:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch listing details' 
      });
    }
  }
  
  // POST /api/v1/admin/listings - 创建上市申请（管理员）
  async createListing(req, res) {
    try {
      // 验证用户权限（简化版）
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ 
          success: false, 
          error: 'Admin access required' 
        });
      }
      
      // 验证请求数据
      const validation = this.validateListingData(req.body);
      if (!validation.valid) {
        return res.status(400).json({ 
          success: false, 
          error: validation.message 
        });
      }
      
      const listing = await this.repository.create({
        ...req.body,
        status: 'PENDING_REVIEW',
        listing_date: null
      });
      
      res.status(201).json({
        success: true,
        data: listing
      });
    } catch (error) {
      console.error('Error creating listing:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to create listing' 
      });
    }
  }
  
  // PUT /api/v1/admin/listings/:id - 更新上市信息
  async updateListing(req, res) {
    try {
      const { id } = req.params;
      
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ 
          success: false, 
          error: 'Admin access required' 
        });
      }
      
      const updated = await this.repository.update(id, req.body);
      
      if (!updated) {
        return res.status(404).json({ 
          success: false, 
          error: 'Listing not found' 
        });
      }
      
      res.json({
        success: true,
        data: updated
      });
    } catch (error) {
      console.error('Error updating listing:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to update listing' 
      });
    }
  }
  
  // DELETE /api/v1/admin/listings/:id - 删除上市
  async deleteListing(req, res) {
    try {
      const { id } = req.params;
      
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ 
          success: false, 
          error: 'Admin access required' 
        });
      }
      
      await this.repository.delete(id);
      
      res.json({
        success: true,
        message: 'Listing deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting listing:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to delete listing' 
      });
    }
  }
  
  // 验证函数
  validateListingData(data) {
    const required = ['asset_id', 'total_supply', 'price_per_token', 'valuation_usd'];
    for (const field of required) {
      if (!data[field]) {
        return { valid: false, message: `Missing required field: ${field}` };
      }
    }
    
    // 验证投资者资格结构
    if (data.investor_eligibility) {
      const elig = data.investor_eligibility;
      if (!elig.min_kyc_tier || !elig.allowed_countries) {
        return { valid: false, message: 'Invalid investor eligibility structure' };
      }
    }
    
    return { valid: true };
  }
}

module.exports = ListingsController;