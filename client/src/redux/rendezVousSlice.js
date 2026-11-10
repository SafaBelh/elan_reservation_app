// ==============================================================================
// src/redux/rendezVousSlice.js
// Tiroir Redux : liste des rendez-vous (client ou admin selon la vue).
// ==============================================================================

import { createSlice } from '@reduxjs/toolkit';

const rendezVousSlice = createSlice({
  name: 'rendezVous',
  initialState: {
    items: [],
    loading: false,
    error: null
  },
  reducers: {
    // 1. Remplir la liste (GET)
    setRendezVous: (state, action) => {
      state.items = action.payload;
      state.loading = false;
      state.error = null;
    },

    // 2. Ajouter un rendez-vous en tete (POST)
    addRendezVous: (state, action) => {
      state.items.unshift(action.payload);
    },

    // 3. Remplacer un rendez-vous apres modification (PUT)
    updateRendezVous: (state, action) => {
      const index = state.items.findIndex((r) => r._id === action.payload._id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },

    // 4. Retirer un rendez-vous (DELETE)
    removeRendezVous: (state, action) => {
      state.items = state.items.filter((r) => r._id !== action.payload);
    },

    // 5. Chargement / erreur
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    }
  }
});

export const {
  setRendezVous,
  addRendezVous,
  updateRendezVous,
  removeRendezVous,
  setLoading,
  setError
} = rendezVousSlice.actions;

export default rendezVousSlice.reducer;
