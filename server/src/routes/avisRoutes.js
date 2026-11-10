// ==============================================================================
// src/routes/avisRoutes.js
// Lecture publique des temoignages, depot protege, suppression admin.
// ==============================================================================

const express = require('express');
const router = express.Router();

const { getAvis, createAvis, deleteAvis } = require('../controllers/avisController');
const { protect, adminOnly } = require('../middlewares/authMiddleware');

router.get('/', getAvis);
router.post('/', protect, createAvis);
router.delete('/:id', protect, adminOnly, deleteAvis);

module.exports = router;
