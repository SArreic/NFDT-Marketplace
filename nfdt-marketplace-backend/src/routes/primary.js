// src/routes/primary.js
const express = require('express');
const router = express.Router();

const controller = require('../controllers/PrimaryTradeController');

router.post('/buy', controller.buy.bind(controller));
router.get('/orders', controller.getMyOrders.bind(controller));

module.exports = router;
