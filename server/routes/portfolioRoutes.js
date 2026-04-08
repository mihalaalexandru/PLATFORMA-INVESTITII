const express = require('express');
const router = express.Router();
const { getPortfolio, getBalanceHistory } = require('../controllers/portfolioController');
const { requireAuth } = require('../middleware/auth');

router.get('/:userId', requireAuth, getPortfolio);
router.get('/history/:userId', requireAuth, getBalanceHistory);

module.exports = router;