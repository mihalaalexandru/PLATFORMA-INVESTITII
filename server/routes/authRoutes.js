const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  forgotPassword, 
  resetPassword, 
  updateUser,
  changePassword,
  deleteAccount
} = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:token', resetPassword);

router.put('/update-profile', requireAuth, updateUser);
router.put('/change-password', requireAuth, changePassword);
router.delete('/delete-account/:id', requireAuth, deleteAccount);

module.exports = router;