// ==============================================================================
// src/controllers/userController.js
// Consultation des comptes clients (reservee a l'administrateur).
// ==============================================================================

const User = require('../models/userModel');

// GET /api/users (admin uniquement)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getAllUsers };
