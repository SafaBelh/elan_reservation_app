// ==============================================================================
// src/models/rendezVousModel.js
// Modele 3/4 : Rendez-vous (entite principale)
// Relations 1:N  ->  un client possede plusieurs rendez-vous
//               ->  une prestation est liee a plusieurs rendez-vous
// ==============================================================================

const mongoose = require('mongoose');

const rendezVousSchema = new mongoose.Schema(
  {
    // Reference vers le client qui a reserve (relation 1:N)
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Le client est obligatoire']
    },
    // Reference vers la prestation choisie (relation 1:N)
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: [true, 'La prestation est obligatoire']
    },
    // On stocke la date au format ISO "AAAA-MM-JJ" : tri et filtrage fiables,
    // sans decalage de fuseau horaire.
    date: {
      type: String,
      required: [true, 'La date est obligatoire'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'La date doit etre au format AAAA-MM-JJ']
    },
    heure: {
      type: String,
      required: [true, "L'heure est obligatoire"],
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, "L'heure doit etre au format HH:MM"]
    },
    statut: {
      type: String,
      enum: {
        values: ['en_attente', 'confirme', 'termine', 'annule'],
        message: "{VALUE} n'est pas un statut autorise"
      },
      default: 'en_attente'
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Les notes ne peuvent pas depasser 500 caracteres']
    }
  },
  { timestamps: true }
);

// Evite deux rendez-vous au meme creneau (index de performance + logique applicative)
rendezVousSchema.index({ date: 1, heure: 1 });

// Jointure virtuelle : permet de recuperer l'avis lie avec .populate('avis')
rendezVousSchema.virtual('avis', {
  ref: 'Avis',
  localField: '_id',
  foreignField: 'rendezVous',
  justOne: true
});

rendezVousSchema.set('toJSON', { virtuals: true });
rendezVousSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('RendezVous', rendezVousSchema);
