// src/routes/listings.js
const express = require('express');
const router = express.Router();

const controller = require('../controllers/ListingsController');

// 公共路由
router.get('/', controller.getListings.bind(controller));
router.get('/:id', controller.getListingDetail.bind(controller));

// 管理员路由
router.post('/admin', controller.createListing.bind(controller));
router.put('/admin/:id', controller.updateListing.bind(controller));
router.delete('/admin/:id', controller.deleteListing.bind(controller));

module.exports = router;
