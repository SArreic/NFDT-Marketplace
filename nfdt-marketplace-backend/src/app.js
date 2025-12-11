// src/app.js - 快速启动版本
const express = require('express');
const cors = require('cors');
const db = require('./database/db');

const app = express();
app.use(cors());
app.use(express.json());

// 测试端点
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 获取上市代币列表
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

// 插入测试数据端点（仅开发用）
app.post('/api/test/seed', async (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ error: 'Only available in development' });
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
      message: 'Test data inserted',
      asset,
      listing
    });
  } catch (error) {
    console.error('Error seeding test data:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 API Endpoints:`);
  console.log(`   GET  http://localhost:${PORT}/api/health`);
  console.log(`   GET  http://localhost:${PORT}/api/v1/market/listings`);
  console.log(`   POST http://localhost:${PORT}/api/test/seed (dev only)`);
});