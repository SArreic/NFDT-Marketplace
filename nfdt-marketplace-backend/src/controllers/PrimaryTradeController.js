// src/controllers/PrimaryTradeController.js

const PrimaryTradeService = require('../services/PrimaryTradeService');

class PrimaryTradeController {
  /**
   * POST /api/v1/primary/buy
   * 一级市场购买
   */
  async buy(req, res, next) {
    try {
      const result = await PrimaryTradeService.buy(req.body, req.user);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/primary/orders
   * 查询当前用户的一级市场订单（预留）
   */
  async getMyOrders(req, res, next) {
    try {
      // 这里后续可以接 PrimaryOrderRepository.findByBuyer
      res.json({
        success: true,
        data: []
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new PrimaryTradeController();
