// src/routes/primary.js

const express = require('express');
const router = express.Router();

const PrimaryTradeController = require('../controllers/PrimaryTradeController');

router.post('/buy', PrimaryTradeController.buy);
router.get('/orders', PrimaryTradeController.getMyOrders);

module.exports = router;
