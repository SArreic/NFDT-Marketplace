// src/controllers/ListingsController.js
const ListingService = require('../services/ListingService');

class ListingsController {
  // GET /api/v1/listings
  async getListings(req, res, next) {
    try {
      const result = await ListingService.getMarketListings(req.query);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  // GET /api/v1/listings/:id
  async getListingDetail(req, res, next) {
    try {
      const data = await ListingService.getListingDetail(req.params.id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  // POST /api/v1/admin/listings
  async createListing(req, res, next) {
    try {
      const listing = await ListingService.createListing(req.body, req.user);
      res.status(201).json({ success: true, data: listing });
    } catch (err) {
      next(err);
    }
  }

  // PUT /api/v1/admin/listings/:id
  async updateListing(req, res, next) {
    try {
      const updated = await ListingService.updateListing(
        req.params.id,
        req.body,
        req.user
      );
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }

  // DELETE /api/v1/admin/listings/:id
  async deleteListing(req, res, next) {
    try {
      await ListingService.deleteListing(req.params.id, req.user);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ListingsController();
