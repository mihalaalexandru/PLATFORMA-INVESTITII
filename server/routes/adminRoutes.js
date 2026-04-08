const express = require('express');
const router = express.Router();
const { syncSingleAsset } = require('../controllers/adminController');
const { requireAuth } = require('../middleware/auth');

router.post('/sync', requireAuth, syncSingleAsset);

module.exports = router;