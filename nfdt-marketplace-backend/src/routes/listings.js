// src/routes/listings.js - 使用您已创建的Controller
const express = require('express');
const router = express.Router();

// 检查Controller是否存在
let ListingsController;
try {
  ListingsController = require('../controllers/ListingsController');
  const controller = new ListingsController();
  
  // 公共路由
  router.get('/', controller.getMarketListings);
  router.get('/:id', controller.getListingDetail);
  
  // 管理员路由
  router.post('/admin', controller.createListing);
  router.put('/admin/:id', controller.updateListing);
  router.delete('/admin/:id', controller.deleteListing);
  
  console.log('✅ ListingsController loaded successfully');
} catch (error) {
  console.error('❌ Failed to load ListingsController:', error.message);
  console.log('   Make sure src/controllers/ListingsController.js exists');
  
  // 提供占位路由，避免404
  router.get('/', (req, res) => {
    res.status(501).json({
      success: false,
      error: 'Listings API not implemented yet',
      message: 'Please create ListingsController'
    });
  });
}

module.exports = router;