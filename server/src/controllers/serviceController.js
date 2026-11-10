// ==============================================================================
// src/controllers/serviceController.js
// CRUD des prestations du coach.
// Lecture publique / ecriture reservee a l'administrateur.
// ==============================================================================

const Service = require('../models/serviceModel');
const RendezVous = require('../models/rendezVousModel');

// GET /api/services (public)
const getServices = async (req, res) => {
  try {
    const services = await Service.find().sort({ prix: 1, nom: 1 });
    res.status(200).json(services);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/services/:id (public)
const getServiceById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ message: 'Prestation introuvable' });
    }
    res.status(200).json(service);
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Identifiant invalide' });
    }
    res.status(500).json({ message: err.message });
  }
};

// POST /api/services (admin)
const createService = async (req, res) => {
  try {
    const { nom, description, duree, prix, actif } = req.body;

    if (!nom || !description || duree === undefined || prix === undefined) {
      return res.status(400).json({ message: 'nom, description, duree et prix sont obligatoires' });
    }

    const service = await Service.create({ nom, description, duree, prix, actif });
    res.status(201).json(service);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/services/:id (admin)
const updateService = async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!service) {
      return res.status(404).json({ message: 'Prestation introuvable pour la mise a jour' });
    }
    res.status(200).json(service);
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Identifiant invalide' });
    }
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/services/:id (admin)
const deleteService = async (req, res) => {
  try {
    // Integrite referentielle : on refuse la suppression d'une prestation utilisee
    const hasRendezVous = await RendezVous.findOne({ service: req.params.id });
    if (hasRendezVous) {
      return res.status(400).json({
        message: 'Impossible de supprimer une prestation liee a des rendez-vous'
      });
    }

    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) {
      return res.status(404).json({ message: 'Prestation introuvable pour la suppression' });
    }
    res.status(200).json({ message: 'Prestation supprimee avec succes', id: req.params.id });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Identifiant invalide' });
    }
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getServices, getServiceById, createService, updateService, deleteService };
