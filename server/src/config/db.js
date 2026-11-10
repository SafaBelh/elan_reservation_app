// ==============================================================================
// src/config/db.js
// Centralise l'ouverture de la connexion asynchrone vers MongoDB Atlas.
// ==============================================================================

const mongoose = require('mongoose');

async function connectDB(uri) {
  if (!uri) {
    throw new Error("L'URI MongoDB est manquant dans les variables d'environnement (.env)");
  }

  await mongoose.connect(uri, {
    autoIndex: true // Genere automatiquement les index (ex: unique) en developpement
  });

  console.log('Connexion a MongoDB Atlas reussie avec succes !');
}

module.exports = connectDB;
