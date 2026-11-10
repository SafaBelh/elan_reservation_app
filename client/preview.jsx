import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { Provider, useDispatch } from 'react-redux';
import { store } from './src/redux/store';
import App from './src/App';
import Navbar from './src/components/Navbar';
import Footer from './src/components/Footer';
import AuthCard from './src/components/AuthCard';
import RendezVousList from './src/components/RendezVousList';
import AdminPanel from './src/components/admin/AdminPanel';
import axiosClient from './src/api/axiosClient';
import { setServices } from './src/redux/serviceSlice';
import { setAvis } from './src/redux/avisSlice';
import { setRendezVous } from './src/redux/rendezVousSlice';
import './src/index.css';
import './src/App.css';

function Preview() {
  const dispatch = useDispatch();
  const v = new URLSearchParams(window.location.search).get('v') || 'guest';

  useEffect(() => {
    axiosClient.get('/services').then((r) => dispatch(setServices(r.data))).catch(() => {});
    axiosClient.get('/avis').then((r) => dispatch(setAvis(r.data))).catch(() => {});
    axiosClient
      .get('/rendezvous/mes-rendez-vous')
      .then((r) => dispatch(setRendezVous(r.data)))
      .catch(() => {});
  }, [dispatch]);

  const noop = () => {};

  if (v === 'auth') {
    return (
      <div className="app-shell">
        <AuthCard onNavigate={noop} />
      </div>
    );
  }

  if (['admin', 'rdv', 'services', 'clients'].includes(v)) {
    return (
      <div className="app-shell">
        <Navbar view="admin" onNavigate={noop} />
        <AdminPanel initialTab={v === 'admin' ? 'dashboard' : v} />
        <Footer />
      </div>
    );
  }

  if (v === 'client') {
    return (
      <div className="app-shell">
        <Navbar view="mes-rdv" onNavigate={noop} />
        <main className="wrap page">
          <RendezVousList />
        </main>
        <Footer />
      </div>
    );
  }

  return <App />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <Preview />
    </Provider>
  </React.StrictMode>
);
