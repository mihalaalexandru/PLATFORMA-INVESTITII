const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { buyAsset, sellAsset, depositFunds, withdrawFunds, getTransactions } = require('../controllers/tradeController');

router.post('/deposit', requireAuth, depositFunds);
router.post('/buy', requireAuth, buyAsset);
router.post('/sell', requireAuth, sellAsset);
router.get('/history/:userId', requireAuth, getTransactions);
router.post('/withdraw', requireAuth, withdrawFunds);

module.exports = router;