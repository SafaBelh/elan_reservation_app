import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axiosClient from '../../api/axiosClient';
import { showToast } from '../../redux/uiSlice';
import { HEURES, STATUTS, formatDate, sixDerniersMois, initiales } from '../../utils/format';
import Icon from '../Icon';

const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

const STATUTS_DONUT = [
  { key: 'enAttente', label: 'En attente', color: '#f2b13c' },
  { key: 'confirmes', label: 'Confirmés', color: '#7b4dff' },
  { key: 'termines', label: 'Terminés', color: '#2fa37b' },
  { key: 'annules', label: 'Annulés', color: '#f0568b' }
];

export default function AdminStats() {
  const dispatch = useDispatch();
  const items = useSelector((state) => state.rendezVous.items);

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('rdv'); // 'rdv' ou 'revenus'

  useEffect(() => {
    const charger = async () => {
      try {
        const response = await axiosClient.get('/rendezvous/stats');
        setStats(response.data);
      } catch (err) {
        dispatch(
          showToast({
            message: err.response?.data?.message || 'Erreur de chargement des statistiques.',
            type: 'error'
          })
        );
      } finally {
        setLoading(false);
      }
    };

    charger();
  }, [dispatch]);

  if (loading) return <div className="loading-box">Chargement du tableau de bord...</div>;
  if (!stats) return <div className="feedback-alert error">Statistiques indisponibles.</div>;

  // ------------------------------------------------------------ activité 6 mois
  const mois = sixDerniersMois();

  const serieRdv = mois.map(
    (m) => items.filter((r) => r.date?.startsWith(m.key) && r.statut !== 'annule').length
  );

  const serieCa = mois.map((m) =>
    items
      .filter(
        (r) =>
          r.date?.startsWith(m.key) && (r.statut === 'confirme' || r.statut === 'termine')
      )
      .reduce((total, r) => total + (r.service?.prix || 0), 0)
  );

  const serie = mode === 'rdv' ? serieRdv : serieCa;
  const maxSerie = Math.max(1, ...serie);

  // ------------------------------------------------------------ donut statuts
  const donut = STATUTS_DONUT.map((s) => ({
    ...s,
    valeur: stats[s.key] || 0
  }));
  const totalDonut = donut.reduce((total, d) => total + d.valeur, 0) || 1;

  let angle = 0;
  const stops = donut
    .map((d) => {
      const from = (angle / totalDonut) * 360;
      angle += d.valeur;
      const to = (angle / totalDonut) * 360;
      return `${d.color} ${from}deg ${to}deg`;
    })
    .join(', ');

  const actifs = stats.confirmes + stats.termines;

  // ------------------------------------------------------------ taux
  const taux = (valeur) => (stats.total ? Math.round((valeur / stats.total) * 100) : 0);

  const cartesTaux = [
    {
      label: 'Taux de validation',
      valeur: taux(stats.confirmes + stats.termines),
      hint: 'Confirmés + terminés',
      color: '#7b4dff'
    },
    {
      label: "File d'attente",
      valeur: taux(stats.enAttente),
      hint: `${stats.enAttente} demande(s) à traiter`,
      color: '#f2b13c'
    },
    {
      label: 'Complétion',
      valeur: taux(stats.termines),
      hint: 'Séances menées à terme',
      color: '#2fa37b'
    },
    {
      label: 'Annulation',
      valeur: taux(stats.annules),
      hint: `${stats.annules} créneau(x) annulé(s)`,
      color: '#f0568b'
    }
  ];

  // ------------------------------------------------------------ créneaux demandés
  const chaleur = JOURS.map((jour, indexJour) =>
    HEURES.map((heure) => {
      return items.filter((r) => {
        if (!r.date || r.statut === 'annule') return false;
        const d = new Date(`${r.date}T00:00:00`);
        const jourDeLaSemaine = (d.getDay() + 6) % 7; // lundi = 0
        return jourDeLaSemaine === indexJour && r.heure === heure;
      }).length;
    })
  );

  const maxChaleur = Math.max(1, ...chaleur.flat());

  // ------------------------------------------------------------ prestations phares
  const parService = {};

  items.forEach((rdv) => {
    const nom = rdv.service?.nom || 'Prestation';
    if (!parService[nom]) parService[nom] = { nom, rdv: 0, ca: 0 };
    parService[nom].rdv += 1;
    if (rdv.statut === 'confirme' || rdv.statut === 'termine') {
      parService[nom].ca += rdv.service?.prix || 0;
    }
  });

  const topServices = Object.values(parService)
    .sort((a, b) => b.rdv - a.rdv)
    .slice(0, 5);

  const maxRdvService = Math.max(1, ...topServices.map((s) => s.rdv));

  return (
    <div className="admin-content">
      {/* ------------------------------- KPI */}
      <div className="stat-grid">
        <div className="stat-card accent">
          <span className="s-label">
            <Icon name="wallet" size={15} />
            Chiffre d'affaires
          </span>
          <span className="s-value">
            {stats.chiffreAffaires}
            <small>TND</small>
          </span>
          <span className="s-hint">Séances confirmées et terminées</span>
        </div>

        <div className="stat-card">
          <span className="s-label">
            <Icon name="calendar" size={15} />
            Rendez-vous
          </span>
          <span className="s-value">{stats.total}</span>
          <span className="s-hint">{stats.enAttente} en attente de validation</span>
        </div>

        <div className="stat-card">
          <span className="s-label">
            <Icon name="users" size={15} />
            Clients inscrits
          </span>
          <span className="s-value">{stats.totalClients}</span>
          <span className="s-hint">{stats.totalServices} prestations actives</span>
        </div>

        <div className="stat-card">
          <span className="s-label">
            <Icon name="check" size={15} />
            Séances terminées
          </span>
          <span className="s-value">{stats.termines}</span>
          <span className="s-hint">{stats.confirmes} confirmés à venir</span>
        </div>
      </div>

      {/* ------------------------------- activité + donut */}
      <div className="panel-grid">
        <section className="panel">
          <div className="panel-head">
            <div>
              <h3>Activité</h3>
              <p className="panel-sub">6 derniers mois &middot; hors annulations</p>
            </div>

            <div className="toggle-group">
              <button
                className={mode === 'rdv' ? 'active' : ''}
                onClick={() => setMode('rdv')}
              >
                Rendez-vous
              </button>
              <button
                className={mode === 'revenus' ? 'active' : ''}
                onClick={() => setMode('revenus')}
              >
                Revenus
              </button>
            </div>
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
            <div>
              <h3>Répartition par statut</h3>
              <p className="panel-sub">Les {stats.total} rendez-vous, en direct</p>
            </div>
          </div>

          <div className="donut-wrap">
            <div className="donut" style={{ background: `conic-gradient(${stops})` }}>
              <div className="donut-center">
                <b>{actifs}</b>
                <span>actifs</span>
              </div>
            </div>

            <div className="donut-legend">
              {donut.map((d) => (
                <div className="legend-row" key={d.key}>
                  <span className="legend-dot" style={{ background: d.color }} />
                  <span>{d.label}</span>
                  <b>{d.valeur}</b>
                  <span className="pct">
                    {Math.round((d.valeur / totalDonut) * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* ------------------------------- taux */}
      <div className="rate-grid">
        {cartesTaux.map((c) => (
          <div className="rate-card" key={c.label}>
            <span className="rl">{c.label}</span>
            <b>{c.valeur}%</b>
            <div className="rate-track">
              <div
                className="rate-fill"
                style={{ width: `${c.valeur}%`, background: c.color }}
              />
            </div>
            <small>{c.hint}</small>
          </div>
        ))}
      </div>

      {/* ------------------------------- chaleur + prestations */}
      <div className="panel-grid">
        <section className="panel">
          <div className="panel-head">
            <div>
              <h3>Créneaux les plus demandés</h3>
              <p className="panel-sub">Jour × heure &middot; hors annulations</p>
            </div>
          </div>

          <div className="heat">
            <span />
            {HEURES.map((h) => (
              <span className="heat-hour" key={h}>
                {h.slice(0, 2)}h
              </span>
            ))}

            {JOURS.map((jour, indexJour) => (
              <React.Fragment key={jour}>
                <span className="heat-day">{jour}</span>
                {chaleur[indexJour].map((valeur, indexHeure) => {
                  const niveau = valeur ? Math.ceil((valeur / maxChaleur) * 4) : 0;
                  return (
                    <span
                      key={`${jour}-${HEURES[indexHeure]}`}
                      className={`heat-cell${niveau ? ` lv${niveau}` : ''}`}
                      title={`${jour} ${HEURES[indexHeure]} — ${valeur} rendez-vous`}
                    />
                  );
                })}
              </React.Fragment>
            ))}
          </div>

          <div className="heat-legend">
            moins
            <i style={{ background: '#f8eff2' }} />
            <i style={{ background: '#e9d8ff' }} />
            <i style={{ background: '#c9a9ff' }} />
            <i style={{ background: '#a074ff' }} />
            <i style={{ background: '#7b4dff' }} />
            plus
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <h3>Prestations phares</h3>
              <p className="panel-sub">Réservations &middot; revenus</p>
            </div>
          </div>

          {topServices.length === 0 && (
            <p className="muted-note">Aucune réservation pour le moment.</p>
          )}

          <div className="top-list">
            {topServices.map((s) => (
              <div className="top-item" key={s.nom}>
                <div className="top-row">
                  <b>{s.nom}</b>
                  <span>
                    {s.rdv} rdv &middot; {s.ca} TND
                  </span>
                </div>
                <div className="top-track">
                  <div
                    className="top-fill"
                    style={{ width: `${(s.rdv / maxRdvService) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ------------------------------- prochains */}
      <section className="panel">
        <div className="panel-head">
          <div>
            <h3>Prochains rendez-vous</h3>
            <p className="panel-sub">{stats.prochains.length} à venir</p>
          </div>
        </div>

        {stats.prochains.length === 0 && (
          <p className="muted-note">Aucun rendez-vous à venir.</p>
        )}

        <div className="next-list">
          {stats.prochains.map((rdv) => {
            const statut = STATUTS[rdv.statut] || STATUTS.en_attente;
            return (
              <div className="next-item" key={rdv._id}>
                <span className="t-avatar">{initiales(rdv.client?.name)}</span>

                <div className="next-main">
                  <strong>{rdv.client?.name || 'Client'}</strong>
                  <span>{rdv.service?.nom || 'Prestation'}</span>
                </div>

                <div className="next-right">
                  <span className="d">{formatDate(rdv.date)}</span>
                  <span className="h">{rdv.heure}</span>
                  <span className={`status-badge ${statut.className}`}>{statut.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
