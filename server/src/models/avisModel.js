// ==============================================================================
// src/models/avisModel.js
// Modele 4/4 : Avis / temoignage laisse apres une seance terminee
// Relation 1:1 avec un rendez-vous + reference vers le client
// ==============================================================================

const mongoose = require('mongoose');

const avisSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Le client est obligatoire']
    },
    rendezVous: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RendezVous',
      required: [true, 'Le rendez-vous est obligatoire'],
      unique: true // un seul avis par rendez-vous
    },
    note: {
      type: Number,
      required: [true, 'La note est obligatoire'],
      min: [1, 'La note minimale est de 1'],
      max: [5, 'La note maximale est de 5']
    },
    texte: {
      type: String,
      required: [true, "Le texte de l'avis est obligatoire"],
      trim: true,
      maxlength: [500, 'Le texte ne peut pas depasser 500 caracteres']
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Avis', avisSchema);
