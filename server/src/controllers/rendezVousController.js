// ==============================================================================
// src/controllers/rendezVousController.js
// Coeur metier : reservation, consultation, mise a jour et suppression.
// ==============================================================================

const RendezVous = require('../models/rendezVousModel');
const Service = require('../models/serviceModel');
const User = require('../models/userModel');
const Avis = require('../models/avisModel');

const STATUTS_ACTIFS = ['en_attente', 'confirme'];

// Verifie qu'une date + heure est bien dans le futur
const estDansLeFutur = (date, heure) => {
  const creneau = new Date(`${date}T${heure}:00`);
  return !Number.isNaN(creneau.getTime()) && creneau > new Date();
};

// GET /api/rendezvous/disponibilites?date=AAAA-MM-JJ (public)
// Renvoie uniquement les heures deja prises : aucune donnee personnelle.
const getDisponibilites = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ message: 'Parametre date obligatoire (AAAA-MM-JJ)' });
    }

    const pris = await RendezVous.find({
      date,
      statut: { $in: STATUTS_ACTIFS }
    }).select('heure');

    res.status(200).json({
      date,
      heuresReservees: pris.map((r) => r.heure)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/rendezvous/mes-rendez-vous (protege : le client connecte)
const getMesRendezVous = async (req, res) => {
  try {
    const rendezVous = await RendezVous.find({ client: req.user._id })
      .populate('service', 'nom duree prix')
      .populate('avis')
      .sort({ date: -1, heure: -1 });

    res.status(200).json(rendezVous);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/rendezvous (admin : tous les rendez-vous)
const getRendezVous = async (req, res) => {
  try {
    const rendezVous = await RendezVous.find()
      .populate('client', 'name email phone')
      .populate('service', 'nom duree prix')
      .populate('avis')
      .sort({ date: -1, heure: -1 });

    res.status(200).json(rendezVous);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/rendezvous/stats (admin) : tableau de bord
const getStats = async (req, res) => {
  try {
    const [
      total,
      enAttente,
      confirmes,
      termines,
      annules,
      totalClients,
      totalServices,
      revenus,
      prochains
    ] = await Promise.all([
      RendezVous.countDocuments(),
      RendezVous.countDocuments({ statut: 'en_attente' }),
      RendezVous.countDocuments({ statut: 'confirme' }),
      RendezVous.countDocuments({ statut: 'termine' }),
      RendezVous.countDocuments({ statut: 'annule' }),
      User.countDocuments({ role: 'client' }),
      Service.countDocuments({ actif: true }),
      RendezVous.find({ statut: { $in: ['confirme', 'termine'] } }).populate('service', 'prix'),
      RendezVous.find({ statut: { $in: STATUTS_ACTIFS } })
        .populate('client', 'name')
        .populate('service', 'nom')
        .sort({ date: 1, heure: 1 })
        .limit(5)
    ]);

    const chiffreAffaires = revenus.reduce((somme, r) => somme + (r.service ? r.service.prix : 0), 0);

    res.status(200).json({
      total,
      enAttente,
      confirmes,
      termines,
      annules,
      totalClients,
      totalServices,
      chiffreAffaires,
      prochains
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/rendezvous/:id (protege : proprietaire ou admin)
const getRendezVousById = async (req, res) => {
  try {
    const rendezVous = await RendezVous.findById(req.params.id)
      .populate('client', 'name email phone')
      .populate('service', 'nom duree prix')
      .populate('avis');

    if (!rendezVous) {
      return res.status(404).json({ message: 'Rendez-vous introuvable' });
    }

    const estProprietaire = rendezVous.client._id.toString() === req.user._id.toString();
    if (!estProprietaire && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Action interdite : ce rendez-vous ne vous appartient pas' });
    }

    res.status(200).json(rendezVous);
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Identifiant invalide' });
    }
    res.status(500).json({ message: err.message });
  }
};

// POST /api/rendezvous (protege : client connecte)
const createRendezVous = async (req, res) => {
  try {
    const { serviceId, date, heure, notes } = req.body;

    if (!serviceId || !date || !heure) {
      return res.status(400).json({ message: 'serviceId, date et heure sont obligatoires' });
    }

    if (!estDansLeFutur(date, heure)) {
      return res.status(400).json({ message: 'Le creneau choisi doit etre dans le futur' });
    }

    // Verification de l'existence reelle de la prestation
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: 'Prestation introuvable (serviceId invalide)' });
    }
    if (!service.actif) {
      return res.status(400).json({ message: 'Cette prestation est temporairement indisponible' });
    }

    // Verification de la disponibilite du creneau
    const conflit = await RendezVous.findOne({
      date,
      heure,
      statut: { $in: STATUTS_ACTIFS }
    });
    if (conflit) {
      return res.status(409).json({ message: 'Ce creneau est deja reserve, choisissez-en un autre' });
    }

    const rendezVous = await RendezVous.create({
      client: req.user._id, // L'identite vient du token : usurpation impossible
      service: serviceId,
      date,
      heure,
      notes
    });

    const populated = await rendezVous.populate('service', 'nom duree prix');
    res.status(201).json(populated);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/rendezvous/:id (protege : proprietaire ou admin)
const updateRendezVous = async (req, res) => {
  try {
    const rendezVous = await RendezVous.findById(req.params.id);
    if (!rendezVous) {
      return res.status(404).json({ message: 'Rendez-vous introuvable' });
    }

    const estProprietaire = rendezVous.client.toString() === req.user._id.toString();
    const estAdmin = req.user.role === 'admin';

    if (!estProprietaire && !estAdmin) {
      return res.status(403).json({ message: 'Action interdite : ce rendez-vous ne vous appartient pas' });
    }

    // Un client ne peut qu'annuler son rendez-vous (pas de changement de statut arbitraire)
    if (!estAdmin) {
      if (req.body.statut && req.body.statut !== 'annule') {
        return res.status(403).json({ message: 'Un client peut seulement annuler son rendez-vous' });
      }
      if (rendezVous.statut === 'termine' || rendezVous.statut === 'annule') {
        return res.status(400).json({ message: 'Ce rendez-vous ne peut plus etre modifie' });
      }
    }

    const nouvelleDate = req.body.date || rendezVous.date;
    const nouvelleHeure = req.body.heure || rendezVous.heure;
    const nouveauStatut = req.body.statut || rendezVous.statut;

    // Si le creneau change et reste actif, on reverifie la disponibilite
    if ((req.body.date || req.body.heure) && nouveauStatut !== 'annule') {
      const conflit = await RendezVous.findOne({
        _id: { $ne: rendezVous._id },
        date: nouvelleDate,
        heure: nouvelleHeure,
        statut: { $in: STATUTS_ACTIFS }
      });
      if (conflit) {
        return res.status(409).json({ message: 'Ce creneau est deja reserve' });
      }
    }

    rendezVous.date = nouvelleDate;
    rendezVous.heure = nouvelleHeure;
    rendezVous.statut = nouveauStatut;
    if (req.body.notes !== undefined) rendezVous.notes = req.body.notes;
    if (estAdmin && req.body.serviceId) rendezVous.service = req.body.serviceId;

    const updated = await rendezVous.save();
    const populated = await updated.populate('service', 'nom duree prix');
    res.status(200).json(populated);
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

// DELETE /api/rendezvous/:id (protege : proprietaire ou admin)
const deleteRendezVous = async (req, res) => {
  try {
    const rendezVous = await RendezVous.findById(req.params.id);
    if (!rendezVous) {
      return res.status(404).json({ message: 'Rendez-vous introuvable pour la suppression' });
    }

    const estProprietaire = rendezVous.client.toString() === req.user._id.toString();
    if (!estProprietaire && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Action interdite : ce rendez-vous ne vous appartient pas' });
    }

    // Suppression en cascade de l'avis lie (integrite referentielle)
    await Avis.deleteMany({ rendezVous: rendezVous._id });
    await RendezVous.findByIdAndDelete(rendezVous._id);

    res.status(200).json({ message: 'Rendez-vous supprime avec succes', id: req.params.id });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Identifiant invalide' });
    }
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getDisponibilites,
  getMesRendezVous,
  getRendezVous,
  getStats,
  getRendezVousById,
  createRendezVous,
  updateRendezVous,
  deleteRendezVous
};
