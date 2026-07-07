const express = require('express');
const router = express.Router();
const { getWatchlist, toggleWatchlist } = require('../controllers/watchlistController');
const { requireAuth } = require('../middleware/auth');

// rutele pentru watchlist: listare si comutare (adaugare/eliminare) asset
router.get('/:userId', requireAuth, getWatchlist);
router.post('/toggle', requireAuth, toggleWatchlist);

module.exports = router;