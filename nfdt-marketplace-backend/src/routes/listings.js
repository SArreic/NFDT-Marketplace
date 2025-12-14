// src/routes/listings.js

const express = require('express');
const router = express.Router();

const ListingsController = require('../controllers/ListingsController');
const controller = new ListingsController();

// 公共路由
router.get('/', controller.getMarketListings);
router.get('/:id', controller.getListingDetail);

// 管理员路由
router.post('/admin', controller.createListing);
router.put('/admin/:id', controller.updateListing);
router.delete('/admin/:id', controller.deleteListing);

module.exports = router;
