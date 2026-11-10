// ==============================================================================
// src/routes/rendezVousRoutes.js
// IMPORTANT : les routes fixes (/disponibilites, /mes-rendez-vous, /stats)
// doivent etre declarees AVANT la route dynamique /:id.
// ==============================================================================

const express = require('express');
const router = express.Router();

const {
  getDisponibilites,
  getMesRendezVous,
  getRendezVous,
  getStats,
  getRendezVousById,
  createRendezVous,
  updateRendezVous,
  deleteRendezVous
} = require('../controllers/rendezVousController');
const { protect, adminOnly } = require('../middlewares/authMiddleware');

// Routes fixes (publiques ou protegees)
router.get('/disponibilites', getDisponibilites);
router.get('/mes-rendez-vous', protect, getMesRendezVous);
router.get('/stats', protect, adminOnly, getStats);

// Liste complete : admin uniquement (confidentialite des donnees clients)
router.get('/', protect, adminOnly, getRendezVous);

// Detail : proprietaire ou admin
router.get('/:id', protect, getRendezVousById);

// Operations d'ecriture protegees
router.post('/', protect, createRendezVous);
router.put('/:id', protect, updateRendezVous);
router.delete('/:id', protect, deleteRendezVous);

module.exports = router;
