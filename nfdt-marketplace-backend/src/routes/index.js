// src/routes/index.js

const express = require('express');
const router = express.Router();

router.use('/listings', require('./listings'));
router.use('/primary', require('./primary'));

// 统一健康检查
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'NFDT Marketplace API',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
