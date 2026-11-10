// ==============================================================================
// src/routes/serviceRoutes.js
// Consultation publique, ecriture reservee a l'administrateur.
// ==============================================================================

const express = require('express');
const router = express.Router();

const {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService
} = require('../controllers/serviceController');
const { protect, adminOnly } = require('../middlewares/authMiddleware');

// Consultation publique
router.get('/', getServices);
router.get('/:id', getServiceById);

// Operations d'ecriture protegees (JWT + admin)
router.post('/', protect, adminOnly, createService);
router.put('/:id', protect, adminOnly, updateService);
router.delete('/:id', protect, adminOnly, deleteService);

module.exports = router;
