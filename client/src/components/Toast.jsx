import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { clearToast } from '../redux/uiSlice';

export default function Toast() {
  const toast = useSelector((state) => state.ui.toast);
  const dispatch = useDispatch();

  // Disparition automatique apres 3,5 s + nettoyage du minuteur (Seance 4)
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => dispatch(clearToast()), 3500);
    return () => clearTimeout(timer);
  }, [toast, dispatch]);

  if (!toast) return null;

  return (
    <div className={`toast toast-${toast.type || 'success'}`} role="status">
      <span>{toast.message}</span>
      <button onClick={() => dispatch(clearToast())} aria-label="Fermer">
        &times;
      </button>
    </div>
  );
}
