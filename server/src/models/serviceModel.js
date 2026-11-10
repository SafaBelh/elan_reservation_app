// ==============================================================================
// src/models/serviceModel.js
// Modele 2/4 : Prestation / Service proposee par le coach
// Ex : "Coaching individuel", "Gestion du stress", etc.
// ==============================================================================

const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: [true, 'Le nom de la prestation est obligatoire'],
      trim: true,
      maxlength: [80, 'Le nom ne peut pas depasser 80 caracteres']
    },
    description: {
      type: String,
      required: [true, 'La description est obligatoire'],
      trim: true,
      maxlength: [400, 'La description ne peut pas depasser 400 caracteres']
    },
    duree: {
      type: Number,
      required: [true, 'La duree est obligatoire'],
      min: [15, 'La duree minimale est de 15 minutes'],
      max: [240, 'La duree maximale est de 240 minutes']
    },
    prix: {
      type: Number,
      required: [true, 'Le prix est obligatoire'],
      min: [0, 'Le prix ne peut pas etre negatif']
    },
    actif: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Service', serviceSchema);
