import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Footer from './components/Footer';
import Toast from './components/Toast';
import AuthCard from './components/AuthCard';
import BookingForm from './components/BookingForm';
import ServiceList from './components/ServiceList';
import AsideCta from './components/AsideCta';
import RendezVousList from './components/RendezVousList';
import AvisSection from './components/AvisSection';
import AdminPanel from './components/admin/AdminPanel';
import Icon from './components/Icon';

import axiosClient from './api/axiosClient';
import {
  setServices,
  setLoading as setServicesLoading,
  setError as setServicesError
} from './redux/serviceSlice';
import { setAvis } from './redux/avisSlice';
import {
  setRendezVous,
  setLoading as setRdvLoading,
  setError as setRdvError
} from './redux/rendezVousSlice';

// Les trois gestes du parcours client
function Etape({ icone, ton, titre, texte }) {
  return (
    <div className="step-row">
      <span className={`step-icon ${ton}`}>
        <Icon name={icone} size={20} />
      </span>
      <div>
        <h4>{titre}</h4>
        <p>{texte}</p>
      </div>
    </div>
  );
}

export default function App() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const [view, setView] = useState('accueil');
  const isAdmin = user && user.role === 'admin';

  // A la connexion / deconnexion : on choisit la vue par defaut
  useEffect(() => {
    setView(isAdmin ? 'admin' : 'accueil');
  }, [isAdmin]);

  // Prestations + temoignages publics : charges une seule fois
  useEffect(() => {
    const chargerServices = async () => {
      try {
        dispatch(setServicesLoading(true));
        const response = await axiosClient.get('/services');
        dispatch(setServices(response.data));
      } catch (err) {
        dispatch(setServicesError('Prestations indisponibles pour le moment.'));
      }
    };

    const chargerAvis = async () => {
      try {
        const response = await axiosClient.get('/avis');
        dispatch(setAvis(response.data));
      } catch (err) {
        // Silencieux : les temoignages ne bloquent pas l'affichage.
      }
    };

    chargerServices();
    chargerAvis();
  }, [dispatch]);

  // Rendez-vous du client connecte (l'admin charge tout dans son panneau)
  useEffect(() => {
    if (!user || isAdmin) return;

    const chargerMesRendezVous = async () => {
      try {
        dispatch(setRdvLoading(true));
        const response = await axiosClient.get('/rendezvous/mes-rendez-vous');
        dispatch(setRendezVous(response.data));
      } catch (err) {
        dispatch(setRdvError('Impossible de charger vos rendez-vous.'));
      }
    };

    chargerMesRendezVous();
  }, [user, isAdmin, dispatch]);

  // Changement de vue : on remonte en haut de page
  const naviguer = (nouvelleVue) => {
    setView(nouvelleVue);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  // Page de connexion : plein écran, sans barre de navigation
  if (view === 'auth' && !user) {
    return (
      <div className="app-shell">
        <Toast />
        <AuthCard onNavigate={naviguer} />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Toast />
      <Navbar view={view} onNavigate={naviguer} />

      {view === 'admin' && isAdmin ? (
        <AdminPanel />
      ) : view === 'mes-rdv' && user && !isAdmin ? (
        <main className="wrap page">
          <RendezVousList />
        </main>
      ) : (
        <main>
          <Hero onNavigate={naviguer} />

          <section className="section wrap" id="services">
            <div className="section-head">
              <h2 className="section-title">
                Choisissez votre
                <span className="accent">accompagnement</span>
              </h2>
              <p className="section-sub">
                Chaque séance se déroule en visio ou au cabinet, dans un cadre confidentiel.
              </p>
            </div>

            <div className="services-layout">
              <ServiceList onNavigate={naviguer} />
              {user && !isAdmin ? <BookingForm /> : <AsideCta onNavigate={naviguer} />}
            </div>
          </section>

          <section className="section wrap">
            <div className="steps-card">
              <div>
                <h2 className="steps-title">
                  Trois gestes simples,
                  <span className="accent">un vrai mouvement.</span>
                </h2>
              </div>

              <div>
                <Etape
                  icone="compass"
                  ton="tint-pink"
                  titre="Choisissez"
                  texte="Repérez l'accompagnement qui vous parle, en visio ou au cabinet."
                />
                <Etape
                  icone="calendar"
                  ton="tint-violet"
                  titre="Réservez"
                  texte="Sélectionnez une date et un créneau libre. Votre coach confirme votre demande."
                />
                <Etape
                  icone="sparkle"
                  ton="tint-gold"
                  titre="Avancez"
                  texte="Suivez vos séances dans votre espace, puis partagez votre expérience."
                />
              </div>
            </div>
          </section>

          <AvisSection />
        </main>
      )}

      <Footer />
    </div>
  );
}
