import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axiosClient from '../api/axiosClient';
import { setRendezVous, setLoading, setError } from '../redux/rendezVousSlice';
import { showToast } from '../redux/uiSlice';
import {
  formatDate,
  formatPrix,
  joursRestants,
  sixDerniersMois
} from '../utils/format';
import RendezVousCard from './RendezVousCard';
import Flower from './Flower';
import Icon from './Icon';

const REPARTITION = [
  { key: 'termine', label: 'Terminées', color: '#2fa37b' },
  { key: 'confirme', label: 'Confirmées', color: '#7b4dff' },
  { key: 'en_attente', label: 'En attente', color: '#f2b13c' },
  { key: 'annule', label: 'Annulées', color: '#f0568b' }
];

export default function RendezVousList() {
  const dispatch = useDispatch();
  const { items, loading, error } = useSelector((state) => state.rendezVous);

  const rafraichir = async () => {
    try {
      dispatch(setLoading(true));
      const response = await axiosClient.get('/rendezvous/mes-rendez-vous');
      dispatch(setRendezVous(response.data));
    } catch (err) {
      dispatch(setError('Impossible de charger vos rendez-vous.'));
      dispatch(showToast({ message: 'Serveur Express injoignable.', type: 'error' }));
    }
  };

  // ---------------------------------------------------------------- chiffres
  const maintenant = new Date();
  const aVenirListe = items
    .filter(
      (r) =>
        (r.statut === 'en_attente' || r.statut === 'confirme') &&
        new Date(`${r.date}T${r.heure}:00`) >= maintenant
    )
    .sort((a, b) => `${a.date}T${a.heure}`.localeCompare(`${b.date}T${b.heure}`));

  const prochain = aVenirListe[0];
  const termines = items.filter((r) => r.statut === 'termine');

  const minutesRecues = termines.reduce((total, r) => total + (r.service?.duree || 0), 0);
  const montantInvesti = termines.reduce((total, r) => total + (r.service?.prix || 0), 0);

  const jours = prochain ? joursRestants(prochain.date) : null;
  const quand =
    jours === null
      ? ''
      : jours <= 0
        ? "Aujourd'hui"
        : jours === 1
          ? 'Demain'
          : `Dans ${jours} jours`;

  // ---------------------------------------------------------------- graphiques
  const mois = sixDerniersMois();
  const serie = mois.map(
    (m) => items.filter((r) => r.date?.startsWith(m.key) && r.statut !== 'annule').length
  );
  const maxSerie = Math.max(1, ...serie);

  const repartition = REPARTITION.map((r) => ({
    ...r,
    valeur: items.filter((rdv) => rdv.statut === r.key).length
  }));
  const totalRepartition = repartition.reduce((total, r) => total + r.valeur, 0);

  const tries = [...items].sort((a, b) =>
    `${b.date}T${b.heure}`.localeCompare(`${a.date}T${a.heure}`)
  );

  return (
    <>
      <header className="client-head">
        <div>
          <h1>
            Mes rendez-vous<span className="dot-pink">.</span>
          </h1>
          <p>Suivez vos demandes, annulez un créneau ou laissez un avis après votre séance.</p>
        </div>
      </header>

      {error && <div className="feedback-alert error">{error}</div>}

      <div className="client-grid">
        <div className="rdv-hero">
          {prochain ? (
            <>
              <div>
                <p className="lbl">Prochaine séance</p>
                <h3>{quand}</h3>
                <p className="when">
                  {prochain.service?.nom || 'Prestation'}
                  <br />
                  {formatDate(prochain.date)} &middot; {prochain.heure}
                </p>
              </div>
              <span className="hero-status">
                {prochain.statut === 'confirme' ? 'Confirmé par le coach' : 'En attente de confirmation'}
              </span>
              <Flower size={168} className="hero-flower-deco" />
            </>
          ) : (
            <div>
              <p className="lbl">Prochaine séance</p>
              <h3>Rien à l'horizon</h3>
              <p className="when">
                Choisissez une prestation sur la page d'accueil pour réserver votre
                premier créneau.
              </p>
            </div>
          )}
        </div>

        <div className="kpi-grid">
          <div className="kpi-card">
            <span className="kpi-icon tint-pink">
              <Icon name="calendar" size={19} />
            </span>
            <b>{items.length}</b>
            <span>rendez-vous au total</span>
          </div>

          <div className="kpi-card">
            <span className="kpi-icon tint-violet">
              <Icon name="sparkle" size={19} />
            </span>
            <b>{aVenirListe.length}</b>
            <span>créneaux à venir</span>
          </div>

          <div className="kpi-card">
            <span className="kpi-icon tint-green">
              <Icon name="check" size={19} strokeWidth={2.4} />
            </span>
            <b>{termines.length}</b>
            <span>séances terminées</span>
          </div>

          <div className="kpi-card">
            <span className="kpi-icon tint-gold">
              <Icon name="clock" size={19} />
            </span>
            <b>
              {minutesRecues >= 60
                ? `${Math.floor(minutesRecues / 60)}h${minutesRecues % 60 ? minutesRecues % 60 : ''}`
                : `${minutesRecues} min`}
            </b>
            <span>d'accompagnement reçu</span>
          </div>
        </div>
      </div>

      <div className="panel-grid">
        <section className="panel">
          <div className="panel-head">
            <h3>Votre rythme</h3>
            <span className="panel-sub">6 derniers mois &middot; hors annulations</span>
          </div>

          <div className="bars">
            <div className="bars-lines" aria-hidden="true">
              <i />
              <i />
              <i />
            </div>

            {mois.map((m, index) => (
              <div className="bar-col" key={m.key}>
                <span className="bar-val">{serie[index] || ''}</span>
                <div
                  className={serie[index] ? 'bar' : 'bar ghost'}
                  style={{ height: `${Math.max(4, (serie[index] / maxSerie) * 140)}px` }}
                />
                <span className="bar-lbl">{m.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h3>Votre parcours</h3>
            <span className="panel-sub">{formatPrix(montantInvesti)} investis</span>
          </div>

          <div className="stack-bar">
            {repartition
              .filter((r) => r.valeur > 0)
              .map((r) => (
                <span
                  key={r.key}
                  style={{
                    width: `${(r.valeur / (totalRepartition || 1)) * 100}%`,
                    background: r.color
                  }}
                />
              ))}
          </div>

          <div className="stack-legend">
            {repartition.map((r) => (
              <div className="legend-row" key={r.key}>
                <span className="legend-dot" style={{ background: r.color }} />
                <span>{r.label}</span>
                <b>{r.valeur}</b>
                <span className="pct">
                  {totalRepartition ? Math.round((r.valeur / totalRepartition) * 100) : 0}%
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="list-head">
        <div>
          <h2>Historique et prochains rendez-vous</h2>
          <p>
            {items.length} rendez-vous au total. Les demandes en attente peuvent être annulées.
          </p>
        </div>

        <button className="btn btn-ghost btn-sm" onClick={rafraichir} disabled={loading}>
          <Icon name="refresh" size={14} />
          {loading ? 'Chargement...' : 'Rafraîchir'}
        </button>
      </div>

      {loading && <div className="loading-box">Chargement de vos rendez-vous...</div>}

      {!loading && tries.length === 0 && (
        <div className="empty-state">
          <p>Aucun rendez-vous pour le moment.</p>
          <p className="empty-sub">
            Choisissez une prestation sur la page d'accueil pour commencer.
          </p>
        </div>
      )}

      {!loading && tries.length > 0 && (
        <div className="rdv-list">
          {tries.map((rdv) => (
            <RendezVousCard key={rdv._id} rdv={rdv} />
          ))}
        </div>
      )}
    </>
  );
}
