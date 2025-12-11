// src/app.js - 整合版本（保留所有功能 + 新架构）
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const db = require('./database/db');

const app = express();

// ==================== 中间件配置 ====================
app.use(helmet()); // 安全头部
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('dev')); // 请求日志
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================== 现有功能端点（保持不变） ====================

// 1. 测试端点（保留）
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'NFDT Marketplace API',
    version: '1.0.0'
  });
});

// 2. 获取上市代币列表（暂时保留，稍后迁移到路由）
app.get('/api/v1/market/listings', async (req, res) => {
  try {
    const listings = await db('token_listings').select('*').limit(10);
    res.json({ 
      success: true,
      data: listings,
      count: listings.length
    });
  } catch (error) {
    console.error('Error fetching listings:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// 3. 插入测试数据端点（保留，仅开发用）
app.post('/api/test/seed', async (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ 
      success: false,
      error: 'Only available in development environment' 
    });
  }
  
  try {
    // 先插入一个测试资产
    const [asset] = await db('assets').insert({
      name: 'Singapore Solar Farm #1',
      type: 'green_energy',
      description: 'A 50MW solar installation in Singapore'
    }).returning('*');
    
    // 插入测试代币上市
    const [listing] = await db('token_listings').insert({
      asset_id: asset.id,
      status: 'LISTED',
      total_supply: '1000000.000000000000000000',
      tokens_for_sale: '500000.000000000000000000',
      price_per_token: '10.500000000000000000',
      valuation_usd: '10500000.00',
      currency_address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
      investor_eligibility: JSON.stringify({
        min_kyc_tier: 2,
        accredited_investor_only: false,
        allowed_countries: ['SG', 'HK'],
        min_investment_usd: '1000.00',
        max_investment_usd: '100000.00'
      }),
      esg_score: 8.5,
      esg_details: JSON.stringify({
        environmental: 9.0,
        social: 8.0,
        governance: 8.5
      }),
      regulatory_disclosures: ['prospectus.pdf', 'audit-report.pdf'],
      listing_date: new Date()
    }).returning('*');
    
    res.json({ 
      success: true,
      message: 'Test data inserted successfully',
      data: {
        asset,
        listing: {
          ...listing,
          investor_eligibility: typeof listing.investor_eligibility === 'string' 
            ? JSON.parse(listing.investor_eligibility) 
            : listing.investor_eligibility,
          esg_details: typeof listing.esg_details === 'string'
            ? JSON.parse(listing.esg_details)
            : listing.esg_details
        }
      }
    });
  } catch (error) {
    console.error('Error seeding test data:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// ==================== 新路由系统（逐步迁移） ====================

// 检查路由文件是否存在，如果存在则加载
let routes;
try {
  routes = require('./routes');
  app.use('/api/v1', routes);
  console.log('✅ Routes loaded successfully');
} catch (error) {
  console.log('⚠️  Routes not found, using direct endpoints only');
  console.log('   Run: mkdir -p src/routes && touch src/routes/index.js');
}

// ==================== 错误处理 ====================

// 404处理 - 捕获未匹配的路由
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.path,
    method: req.method
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('🚨 Server Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });
  
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'development' 
      ? err.message 
      : 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ==================== 服务器启动 ====================

const PORT = process.env.PORT || 3001;

// 数据库连接测试
db.raw('SELECT 1 as connection_test')
  .then(() => {
    console.log('✅ Database connection established');
    
    // 启动服务器
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log('\n📊 Available Endpoints:');
      console.log('='.repeat(50));
      console.log('HEALTH & TEST:');
      console.log(`   GET  http://localhost:${PORT}/api/health`);
      console.log(`   POST http://localhost:${PORT}/api/test/seed (dev only)`);
      console.log('\nMARKET LISTINGS (legacy):');
      console.log(`   GET  http://localhost:${PORT}/api/v1/market/listings`);
      
      // 如果路由已加载，显示新端点
      if (routes) {
        console.log('\nNEW ROUTES (via /api/v1):');
        console.log(`   GET  http://localhost:${PORT}/api/v1/listings`);
        console.log(`   GET  http://localhost:${PORT}/api/v1/listings/:id`);
        console.log(`   POST http://localhost:${PORT}/api/v1/listings/admin`);
      } else {
        console.log('\n⚠️  New routes not configured');
        console.log('   To enable: create src/routes/index.js');
      }
      console.log('='.repeat(50));
    });
  })
  .catch(err => {
    console.error('❌ Failed to connect to database:', err.message);
    console.log('\nTroubleshooting steps:');
    console.log('1. Check if PostgreSQL is running');
    console.log('2. Verify .env file configuration');
    console.log('3. Check database credentials');
    process.exit(1);
  });

module.exports = app; // 用于测试