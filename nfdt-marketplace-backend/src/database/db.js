// src/database/db.js
const knex = require('knex');
const knexfile = require('../../knexfile');

const environment = process.env.NODE_ENV || 'development';
const db = knex(knexfile[environment]);

// 测试连接
db.raw('SELECT 1+1 as result')
  .then(() => console.log('✅ Database connection test passed'))
  .catch(err => {
    console.error('❌ Database connection failed:', err);
    process.exit(1);
  });

module.exports = db;