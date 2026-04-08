const express = require('express');
const router = express.Router();
const { getWatchlist, toggleWatchlist } = require('../controllers/watchlistController');
const { requireAuth } = require('../middleware/auth');

router.get('/:userId', requireAuth, getWatchlist);
router.post('/toggle', requireAuth, toggleWatchlist);

module.exports = router;