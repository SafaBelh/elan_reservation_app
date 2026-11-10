// ==============================================================================
// src/routes/authRoutes.js
// Routes publiques d'authentification + profil protege.
// ==============================================================================

const express = require('express');
const router = express.Router();

const { registerUser, loginUser, getProfile } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

// Routes publiques
router.post('/register', registerUser);
router.post('/login', loginUser);

// Route privee protegee par Token JWT
router.get('/profile', protect, getProfile);

module.exports = router;
