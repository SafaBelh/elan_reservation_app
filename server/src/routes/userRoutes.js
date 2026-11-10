// ==============================================================================
// src/routes/userRoutes.js
// Consultation des comptes : administrateur uniquement.
// ==============================================================================

const express = require('express');
const router = express.Router();

const { getAllUsers } = require('../controllers/userController');
const { protect, adminOnly } = require('../middlewares/authMiddleware');

// JWT valide + role admin requis
router.get('/', protect, adminOnly, getAllUsers);

module.exports = router;
