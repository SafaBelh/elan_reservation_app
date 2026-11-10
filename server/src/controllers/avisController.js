// ==============================================================================
// src/controllers/avisController.js
// Temoignages : lecture publique, depot apres une seance terminee,
// suppression reservee a l'administrateur.
// ==============================================================================

const Avis = require('../models/avisModel');
const RendezVous = require('../models/rendezVousModel');

// GET /api/avis (public)
const getAvis = async (req, res) => {
  try {
    const avis = await Avis.find()
      .populate('client', 'name')
      .populate({
        path: 'rendezVous',
        select: 'date service',
        populate: { path: 'service', select: 'nom' }
      })
      .sort({ createdAt: -1 });

    res.status(200).json(avis);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/avis (protege : client proprietaire du rendez-vous termine)
const createAvis = async (req, res) => {
  try {
    const { rendezVousId, note, texte } = req.body;

    if (!rendezVousId || !note || !texte) {
      return res.status(400).json({ message: 'rendezVousId, note et texte sont obligatoires' });
    }

    const rendezVous = await RendezVous.findById(rendezVousId);
    if (!rendezVous) {
      return res.status(404).json({ message: 'Rendez-vous introuvable' });
    }

    // Le depot d'avis est reserve au client qui a vecu la seance
    if (rendezVous.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Action interdite : ce rendez-vous ne vous appartient pas' });
    }

    if (rendezVous.statut !== 'termine') {
      return res.status(400).json({ message: 'Vous pouvez laisser un avis uniquement apres une seance terminee' });
    }

    // Un seul avis par rendez-vous
    const existe = await Avis.findOne({ rendezVous: rendezVousId });
    if (existe) {
      return res.status(409).json({ message: 'Un avis existe deja pour ce rendez-vous' });
    }

    const avis = await Avis.create({
      client: req.user._id,
      rendezVous: rendezVousId,
      note,
      texte
    });

    const populated = await avis.populate('client', 'name');
    res.status(201).json(populated);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/avis/:id (admin)
const deleteAvis = async (req, res) => {
  try {
    const avis = await Avis.findByIdAndDelete(req.params.id);
    if (!avis) {
      return res.status(404).json({ message: 'Avis introuvable' });
    }
    res.status(200).json({ message: 'Avis supprime avec succes', id: req.params.id });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Identifiant invalide' });
    }
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getAvis, createAvis, deleteAvis };
