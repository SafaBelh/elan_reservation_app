// ==============================================================================
// src/middlewares/errorMiddleware.js
// Filet de securite global : transforme les erreurs en reponses JSON propres.
// ==============================================================================

// Route inexistante -> on transmet une erreur au gestionnaire central
const notFound = (req, res, next) => {
  res.status(404);
  next(new Error(`Route introuvable : ${req.originalUrl}`));
};

// Gestionnaire central : codes HTTP conformes (400, 404, 409, 500)
const errorHandler = (err, req, res, next) => {
  let status = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  let message = err.message || 'Erreur serveur';

  // Identifiant Mongo mal forme (ex: /api/rendezvous/abc)
  if (err.name === 'CastError') {
    status = 400;
    message = 'Identifiant de ressource invalide (format ObjectId attendu)';
  }

  // Doublon sur un index unique (ex: email deja utilise)
  if (err.code === 11000) {
    status = 409;
    message = 'Cette valeur existe deja (doublon)';
  }

  // Validation Mongoose (champ manquant, regex, enum, min/max...)
  if (err.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors).map((e) => e.message).join(' | ');
  }

  res.status(status).json({ message });
};

module.exports = { notFound, errorHandler };
