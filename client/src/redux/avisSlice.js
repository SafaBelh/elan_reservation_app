// ==============================================================================
// src/redux/avisSlice.js
// Tiroir Redux : temoignages publics.
// ==============================================================================

import { createSlice } from '@reduxjs/toolkit';

const avisSlice = createSlice({
  name: 'avis',
  initialState: {
    items: [],
    loading: false,
    error: null
  },
  reducers: {
    setAvis: (state, action) => {
      state.items = action.payload;
      state.loading = false;
      state.error = null;
    },
    addAvis: (state, action) => {
      state.items.unshift(action.payload);
    },
    removeAvis: (state, action) => {
      state.items = state.items.filter((a) => a._id !== action.payload);
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

export const { setAvis, addAvis, removeAvis, setLoading, setError } = avisSlice.actions;

export default avisSlice.reducer;
