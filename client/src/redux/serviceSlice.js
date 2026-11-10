// ==============================================================================
// src/redux/serviceSlice.js
// Tiroir Redux : catalogue des prestations du coach.
// ==============================================================================

import { createSlice } from '@reduxjs/toolkit';

const serviceSlice = createSlice({
  name: 'services',
  initialState: {
    items: [],
    loading: false,
    error: null
  },
  reducers: {
    setServices: (state, action) => {
      state.items = action.payload;
      state.loading = false;
      state.error = null;
    },
    addService: (state, action) => {
      state.items.unshift(action.payload);
    },
    updateService: (state, action) => {
      const index = state.items.findIndex((s) => s._id === action.payload._id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    removeService: (state, action) => {
      state.items = state.items.filter((s) => s._id !== action.payload);
    },
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
  setServices,
  addService,
  updateService,
  removeService,
  setLoading,
  setError
} = serviceSlice.actions;

export default serviceSlice.reducer;
