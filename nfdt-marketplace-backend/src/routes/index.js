// src/routes/index.js - 初始版本
const express = require('express');
const router = express.Router();

// 检查Controller是否存在，如果存在则加载
let listingsRouter;
try {
  listingsRouter = require('./listings');
  router.use('/listings', listingsRouter);
  console.log('✅ Listings routes loaded');
} catch (error) {
  console.log('⚠️  Listings routes not found');
}

// 健康检查端点（与现有端点保持一致）
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK via routes',
    timestamp: new Date().toISOString() 
  });
});

module.exports = router;