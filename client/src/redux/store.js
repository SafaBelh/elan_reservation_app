// ==============================================================================
// src/redux/store.js
// Le "coffre-fort" central : un tiroir par domaine.
// ==============================================================================

import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import rendezVousReducer from './rendezVousSlice';
import serviceReducer from './serviceSlice';
import avisReducer from './avisSlice';
import uiReducer from './uiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    rendezVous: rendezVousReducer,
    services: serviceReducer,
    avis: avisReducer,
    ui: uiReducer
  }
});
