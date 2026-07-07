const express = require('express');
const router = express.Router();
const { syncSingleAsset } = require('../controllers/adminController');
const { requireAuth } = require('../middleware/auth');

// ruta admin pentru sincronizarea manuala a pretului unui asset
router.post('/sync', requireAuth, syncSingleAsset);

module.exports = router;