import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axiosClient from '../../api/axiosClient';
import { setRendezVous, setLoading, setError } from '../../redux/rendezVousSlice';
import AdminStats from './AdminStats';
import AdminRendezVous from './AdminRendezVous';
import AdminServices from './AdminServices';
import AdminUsers from './AdminUsers';
import Icon from '../Icon';

const TABS = [
  { id: 'dashboard', label: 'Tableau de bord', icon: 'chart' },
  { id: 'rdv', label: 'Rendez-vous', icon: 'calendar' },
  { id: 'services', label: 'Prestations', icon: 'layers' },
  { id: 'clients', label: 'Clients', icon: 'users' }
];

export default function AdminPanel({ initialTab = 'dashboard' }) {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { items } = useSelector((state) => state.rendezVous);

  const [tab, setTab] = useState(initialTab);

  // Charge tous les rendez-vous des l'ouverture du panneau (compteur Navbar inclus)
  useEffect(() => {
    const chargerTous = async () => {
      try {
        dispatch(setLoading(true));
        const response = await axiosClient.get('/rendezvous');
        dispatch(setRendezVous(response.data));
      } catch (err) {
        dispatch(setError('Impossible de charger les rendez-vous.'));
      }
    };

    chargerTous();
  }, [dispatch]);

  const prenom = (user?.name || '').split(' ')[0];
  const enAttente = items.filter((rdv) => rdv.statut === 'en_attente').length;

  const dateLongue = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  return (
    <main className="wrap page">
      <header className="admin-head">
        <div className="admin-greet">
          <p className="today">{dateLongue}</p>
          <h1>
            Bonjour {prenom}
            <span className="dot-pink">.</span>
          </h1>
          <p>Validez les demandes, gérez les prestations et suivez votre activité.</p>
        </div>

        {enAttente > 0 && (
          <button className="pending-pill" onClick={() => setTab('rdv')}>
            <span className="count">{enAttente}</span>
            {enAttente > 1 ? 'demandes à traiter' : 'demande à traiter'}
            <Icon name="arrowUp" size={15} />
          </button>
        )}
      </header>

      <div className="admin-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={tab === t.id ? 'admin-tab active' : 'admin-tab'}
            onClick={() => setTab(t.id)}
          >
            <Icon name={t.icon} size={16} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && <AdminStats />}
      {tab === 'rdv' && <AdminRendezVous />}
      {tab === 'services' && <AdminServices />}
      {tab === 'clients' && <AdminUsers />}
    </main>
  );
}
