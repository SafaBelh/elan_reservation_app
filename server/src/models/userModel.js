// ==============================================================================
// src/models/userModel.js
// Modele 1/4 : Utilisateur (client ou administrateur / coach)
// ==============================================================================

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Le nom est obligatoire'],
      trim: true
    },
    email: {
      type: String,
      required: [true, "L'email est obligatoire"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Format d'email invalide (ex: client@elan.tn)"]
    },
    password: {
      type: String,
      required: [true, 'Le mot de passe est obligatoire'],
      minlength: [6, 'Le mot de passe doit comporter au moins 6 caracteres']
    },
    phone: {
      type: String,
      trim: true,
      // Optionnel : le validateur ne s'execute que si une valeur est fournie.
      match: [/^[0-9+\s]{8,15}$/, 'Numero de telephone invalide (8 a 15 chiffres)']
    },
    role: {
      type: String,
      enum: {
        values: ['client', 'admin'],
        message: "{VALUE} n'est pas un role autorise"
      },
      default: 'client'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
