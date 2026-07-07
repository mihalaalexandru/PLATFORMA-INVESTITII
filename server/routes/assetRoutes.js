const express = require('express');
const router = express.Router();
const { getAssets, getAssetHistory, getMarketNews } = require('../controllers/assetController');

// rutele publice pentru active: lista, istoric grafic si stiri de piata
router.get('/', getAssets);
router.get('/history/:id', getAssetHistory);
router.get('/market-news', getMarketNews);

module.exports = router;