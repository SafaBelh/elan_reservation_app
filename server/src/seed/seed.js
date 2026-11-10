// ==============================================================================
// src/seed/seed.js
// Script d'initialisation : cree un compte admin, deux clients, des
// prestations, des rendez-vous et des avis de demonstration.
//
// Lancer avec : npm run seed
// ATTENTION : ce script VIDE les collections avant de les remplir.
// Il est reserve au developpement / a la demonstration.
// ==============================================================================

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const connectDB = require('../config/db');
const User = require('../models/userModel');
const Service = require('../models/serviceModel');
const RendezVous = require('../models/rendezVousModel');
const Avis = require('../models/avisModel');

// Retourne une date "AAAA-MM-JJ" decalee de n jours par rapport a aujourd'hui
const addDays = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

async function seed() {
  try {
    await connectDB(process.env.MONGODB_URI);

    // 1. Nettoyage complet (ordre : dependants -> parents)
    await Avis.deleteMany({});
    await RendezVous.deleteMany({});
    await Service.deleteMany({});
    await User.deleteMany({});
    console.log('Collections videes.');

    // 2. Utilisateurs (mots de passe haches avec bcrypt)
    const adminPassword = await bcrypt.hash('admin123', 10);
    const clientPassword = await bcrypt.hash('client123', 10);

    const admin = await User.create({
      name: 'Amina Ben Salah',
      email: 'admin@elan.tn',
      password: adminPassword,
      phone: '+216 20 000 000',
      role: 'admin'
    });

    const aya = await User.create({
      name: 'Aya Ben Amor',
      email: 'client@elan.tn',
      password: clientPassword,
      phone: '+216 22 111 222',
      role: 'client'
    });

    const sami = await User.create({
      name: 'Sami Trabelsi',
      email: 'sami@elan.tn',
      password: clientPassword,
      phone: '+216 55 333 444',
      role: 'client'
    });

    console.log('Utilisateurs crees (admin + 2 clients).');

    // 3. Prestations du coach
    const services = await Service.insertMany([
      {
        nom: 'Séance Découverte',
        description: 'Un premier échange de 30 minutes pour clarifier votre besoin et définir un objectif.',
        duree: 30,
        prix: 0
      },
      {
        nom: 'Coaching Individuel',
        description: 'Une séance de 60 minutes pour lever un blocage et avancer concrètement vers votre objectif.',
        duree: 60,
        prix: 120
      },
      {
        nom: 'Coaching de Carrière',
        description: 'Reconversion, prise de poste ou entretien : structurer votre projet professionnel.',
        duree: 90,
        prix: 180
      },
      {
        nom: 'Gestion du Stress et Burn-out',
        description: "Outils concrets pour retrouver de l'énergie et poser des limites saines.",
        duree: 60,
        prix: 140
      },
      {
        nom: 'Bilan de Vie',
        description: 'Une séance longue de 2 heures pour faire le point sur vos priorités et votre équilibre.',
        duree: 120,
        prix: 250
      }
    ]);

    console.log('Prestations creees.');

    // 4. Rendez-vous de demonstration (statuts varies)
    const rdv1 = await RendezVous.create({
      client: aya._id,
      service: services[1]._id,
      date: addDays(3),
      heure: '10:00',
      statut: 'en_attente',
      notes: 'Je souhaite travailler sur ma confiance en moi.'
    });

    const rdv2 = await RendezVous.create({
      client: aya._id,
      service: services[3]._id,
      date: addDays(-5),
      heure: '14:00',
      statut: 'termine',
      notes: 'Seance tres utile.'
    });

    const rdv3 = await RendezVous.create({
      client: sami._id,
      service: services[2]._id,
      date: addDays(5),
      heure: '15:00',
      statut: 'confirme'
    });

    const rdv4 = await RendezVous.create({
      client: sami._id,
      service: services[0]._id,
      date: addDays(-10),
      heure: '09:00',
      statut: 'termine'
    });

    await RendezVous.create({
      client: aya._id,
      service: services[4]._id,
      date: addDays(-2),
      heure: '11:00',
      statut: 'annule'
    });

    // Historique : etale l'activite sur les six derniers mois
    const rdv6 = await RendezVous.create({
      client: sami._id,
      service: services[2]._id,
      date: addDays(-52),
      heure: '16:00',
      statut: 'termine'
    });

    await RendezVous.create({
      client: aya._id,
      service: services[1]._id,
      date: addDays(-71),
      heure: '09:00',
      statut: 'termine'
    });

    await RendezVous.create({
      client: sami._id,
      service: services[3]._id,
      date: addDays(-96),
      heure: '14:00',
      statut: 'annule'
    });

    const rdv9 = await RendezVous.create({
      client: aya._id,
      service: services[2]._id,
      date: addDays(-118),
      heure: '11:00',
      statut: 'termine',
      notes: 'Bilan de milieu de parcours.'
    });

    await RendezVous.create({
      client: sami._id,
      service: services[4]._id,
      date: addDays(-150),
      heure: '10:00',
      statut: 'termine'
    });

    console.log('Rendez-vous crees.');

    // 5. Avis lies aux seances terminees
    await Avis.create({
      client: aya._id,
      rendezVous: rdv2._id,
      note: 5,
      texte: "Un accompagnement bienveillant et tres concret. J'ai enfin compris comment gerer mon stress au quotidien."
    });

    await Avis.create({
      client: sami._id,
      rendezVous: rdv4._id,
      note: 4,
      texte: 'La seance decouverte m a permis de voir clair. Je recommande sans hesitation.'
    });

    console.log('Avis crees.');

    console.log('====================================================');
    console.log('Base de donnees initialisee avec succes !');
    console.log('----------------------------------------------------');
    console.log('Compte ADMIN   : admin@elan.tn  / admin123');
    console.log('Compte CLIENT  : client@elan.tn / client123');
    console.log('Compte CLIENT  : sami@elan.tn   / client123');
    console.log('====================================================');
  } catch (err) {
    console.error('Erreur pendant le seed :', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seed();
