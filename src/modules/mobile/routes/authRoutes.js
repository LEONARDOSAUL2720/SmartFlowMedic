const express = require('express');
const router = express.Router();
const { googleLogin, login, register, getProfile, updateProfile } = require('../controllers/authController');
const { protect } = require('../../../middlewares/auth');

router.post('/google', googleLogin);
router.post('/login', login);
router.post('/register', register);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

module.exports = router;
