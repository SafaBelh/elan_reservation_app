// ==============================================================================
// src/redux/uiSlice.js
// Tiroir Redux : notifications (toast) et prestation selectionnee.
// Evite le "prop drilling" entre la liste des services et le formulaire.
// ==============================================================================

import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    toast: null,
    selectedServiceId: ''
  },
  reducers: {
    // Afficher une notification : dispatch(showToast({ message, type }))
    showToast: (state, action) => {
      state.toast = {
        message: action.payload.message,
        type: action.payload.type || 'success'
      };
    },
    clearToast: (state) => {
      state.toast = null;
    },
    // Memoriser la prestation cliquee dans la liste
    selectService: (state, action) => {
      state.selectedServiceId = action.payload;
    }
  }
});

export const { showToast, clearToast, selectService } = uiSlice.actions;
export default uiSlice.reducer;
