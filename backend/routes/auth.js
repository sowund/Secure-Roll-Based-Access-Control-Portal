const express = require('express');
const { register, login, getMe, googleCallback } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const passport = require('passport');
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, getMe);
router.get('/google', passport.authenticate('google', { scope:['profile','email'] }));
router.get('/google/callback', passport.authenticate('google',{ session:false, failureRedirect:'/api/auth/google/fail' }), googleCallback);
router.get('/google/fail', (req,res) => res.redirect(`${process.env.CLIENT_URL}/auth/google/error`));

module.exports = router;