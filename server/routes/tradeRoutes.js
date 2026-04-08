const express = require('express');
const router = express.Router();
const { depositFunds, buyAsset, sellAsset, getTransactions } = require('../controllers/tradeController');
const { requireAuth } = require('../middleware/auth');

router.post('/deposit', requireAuth, depositFunds);
router.post('/buy', requireAuth, buyAsset);
router.post('/sell', requireAuth, sellAsset);
router.get('/history/:userId', requireAuth, getTransactions);

module.exports = router;