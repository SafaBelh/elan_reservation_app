// ==============================================================================
// src/server.js
// Point d'entree : configuration Express, montage des routeurs,
// connexion MongoDB Atlas puis ecoute du port.
// ==============================================================================

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const rendezVousRoutes = require('./routes/rendezVousRoutes');
const avisRoutes = require('./routes/avisRoutes');
const { notFound, errorHandler } = require('./middlewares/errorMiddleware');

// Chargement des variables d'environnement (.env)
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ==============================================================================
// 1. Middlewares globaux
// ==============================================================================
// En production, CLIENT_URL = l'adresse Vercel. En local (variable absente),
// toutes les origines sont acceptees.
app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json());

// ==============================================================================
// 2. Route racine de verification
// ==============================================================================
app.get('/', (req, res) => {
  res.json({
    message: 'API Coach de Vie - Gestion des rendez-vous (MERN)',
    endpoints: [
      'POST /api/auth/register',
      'POST /api/auth/login',
      'GET  /api/services',
      'GET  /api/rendezvous/mes-rendez-vous',
      'POST /api/rendezvous',
      'GET  /api/rendezvous/stats (admin)',
      'GET  /api/avis'
    ]
  });
});

// ==============================================================================
// 3. Montage des routeurs modulaires
// ==============================================================================
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/rendezvous', rendezVousRoutes);
app.use('/api/avis', avisRoutes);

// ==============================================================================
// 4. Gestion centralisee des erreurs (toujours en dernier)
// ==============================================================================
app.use(notFound);
app.use(errorHandler);

// ==============================================================================
// 5. Connexion asynchrone a MongoDB Atlas puis demarrage de l'ecoute
// ==============================================================================
(async () => {
  try {
    await connectDB(process.env.MONGODB_URI);
    app.listen(PORT, () => {
      console.log(`Serveur MERN en ecoute sur http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Erreur critique de demarrage du serveur :', err.message);
    process.exit(1);
  }
})();
