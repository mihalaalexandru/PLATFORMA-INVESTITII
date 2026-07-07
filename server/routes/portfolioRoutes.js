const express = require('express');
const router = express.Router();
const { getPortfolio, getBalanceHistory } = require('../controllers/portfolioController');
const { requireAuth } = require('../middleware/auth');

// rutele pentru portofoliu si istoricul soldului
// atentie: ruta '/history/:userId' trebuie sa fie inaintea rutei '/:userId' ca sa nu fie confundata cu ea
router.get('/history/:userId', requireAuth, getBalanceHistory);
router.get('/:userId', requireAuth, getPortfolio);

module.exports = router;