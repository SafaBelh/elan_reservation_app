import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import axiosClient from '../api/axiosClient';
import { updateRendezVous } from '../redux/rendezVousSlice';
import { addAvis } from '../redux/avisSlice';
import { showToast } from '../redux/uiSlice';
import { STATUTS, formatDate, formatPrix, etoiles, morceauxDate } from '../utils/format';
import Icon from './Icon';

export default function RendezVousCard({ rdv }) {
  const dispatch = useDispatch();

  const [afficherAvis, setAfficherAvis] = useState(false);
  const [note, setNote] = useState(5);
  const [texte, setTexte] = useState('');
  const [saving, setSaving] = useState(false);

  const statut = STATUTS[rdv.statut] || STATUTS.en_attente;
  const service = rdv.service || {};
  const { dow, day, mon } = morceauxDate(rdv.date);

  const classeRail =
    rdv.statut === 'en_attente'
      ? 'pending'
      : rdv.statut === 'termine'
        ? 'done'
        : rdv.statut === 'annule'
          ? 'cancelled'
          : '';

  const annuler = async () => {
    const message = `Annuler le rendez-vous du ${formatDate(rdv.date)} à ${rdv.heure} ?`;
    if (!window.confirm(message)) return;

    try {
      const response = await axiosClient.put(`/rendezvous/${rdv._id}`, { statut: 'annule' });
      dispatch(updateRendezVous(response.data));
      dispatch(showToast({ message: 'Rendez-vous annulé.', type: 'info' }));
    } catch (err) {
      dispatch(
        showToast({
          message: err.response?.data?.message || "Erreur lors de l'annulation.",
          type: 'error'
        })
      );
    }
  };

  const envoyerAvis = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      const response = await axiosClient.post('/avis', {
        rendezVousId: rdv._id,
        note: Number(note),
        texte
      });

      dispatch(updateRendezVous({ ...rdv, avis: response.data }));
      dispatch(addAvis(response.data));
      dispatch(showToast({ message: 'Merci pour votre avis !', type: 'success' }));

      setAfficherAvis(false);
      setTexte('');
    } catch (err) {
      dispatch(
        showToast({
          message: err.response?.data?.message || "Erreur lors de l'envoi de l'avis.",
          type: 'error'
        })
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <article className="rdv-card">
      <div className={`rdv-date ${classeRail}`}>
        <span className="dow">{dow}.</span>
        <span className="day">{day}</span>
        <span className="mon">{mon}.</span>
      </div>

      <div className="rdv-body">
        <div className="rdv-top">
          <div>
            <h3 className="rdv-service">{service.nom || 'Prestation'}</h3>
            <p className="rdv-meta">
              {formatDate(rdv.date)} &middot; {rdv.heure}
              {service.duree ? ` · ${service.duree} min` : ''}
              {service.prix !== undefined ? ` · ${formatPrix(service.prix)}` : ''}
            </p>
          </div>
          <span className={`status-badge ${statut.className}`}>{statut.label}</span>
        </div>

        {rdv.notes && <p className="rdv-notes">&laquo; {rdv.notes} &raquo;</p>}

        {rdv.avis && (
          <div className="avis-inline">
            <span className="stars">{etoiles(rdv.avis.note)}</span>
            <p>{rdv.avis.texte}</p>
          </div>
        )}

        <div className="rdv-actions">
          {rdv.statut === 'en_attente' && (
            <button className="btn btn-soft-pink btn-sm" onClick={annuler}>
              <Icon name="x" size={13} />
              Annuler
            </button>
          )}

          {rdv.statut === 'termine' && !rdv.avis && (
            <button className="btn btn-soft-gold btn-sm" onClick={() => setAfficherAvis((v) => !v)}>
              <Icon name="sparkle" size={13} />
              {afficherAvis ? 'Fermer' : 'Laisser un avis'}
            </button>
          )}

          {rdv.statut === 'annule' && <span className="muted-note">Rendez-vous annulé</span>}
          {rdv.statut === 'confirme' && <span className="muted-note">Confirmé par le coach</span>}
        </div>

        {afficherAvis && (
          <form className="avis-form" onSubmit={envoyerAvis}>
            <div className="field" style={{ marginTop: 0 }}>
              <label>Votre note</label>
              <select value={note} onChange={(e) => setNote(e.target.value)}>
                <option value={5}>5 — Excellent</option>
                <option value={4}>4 — Très bien</option>
                <option value={3}>3 — Bien</option>
                <option value={2}>2 — Moyen</option>
                <option value={1}>1 — À améliorer</option>
              </select>
            </div>

            <div className="field">
              <label>Votre témoignage</label>
              <textarea
                rows={3}
                value={texte}
                onChange={(e) => setTexte(e.target.value)}
                placeholder="Partagez votre expérience..."
                required
              />
            </div>

            <button type="submit" className="btn btn-pink btn-sm" disabled={saving}>
              {saving ? 'Envoi...' : "Publier l'avis"}
            </button>
          </form>
        )}
      </div>
    </article>
  );
}
