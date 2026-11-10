import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axiosClient from '../api/axiosClient';
import { addRendezVous } from '../redux/rendezVousSlice';
import { showToast } from '../redux/uiSlice';
import { HEURES, formatDate, formatPrix, todayISO } from '../utils/format';
import Icon from './Icon';

export default function BookingForm() {
  const dispatch = useDispatch();
  const { items } = useSelector((state) => state.services);
  const { selectedServiceId } = useSelector((state) => state.ui);

  const services = items.filter((s) => s.actif);

  const [serviceId, setServiceId] = useState('');
  const [date, setDate] = useState('');
  const [heure, setHeure] = useState('');
  const [notes, setNotes] = useState('');
  const [dispo, setDispo] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Pre-selection depuis la liste des prestations (via Redux, sans prop drilling)
  useEffect(() => {
    if (selectedServiceId) setServiceId(selectedServiceId);
  }, [selectedServiceId]);

  useEffect(() => {
    if (!serviceId && services.length > 0) setServiceId(services[0]._id);
  }, [services, serviceId]);

  // A chaque changement de date, on demande les creneaux deja pris
  useEffect(() => {
    if (!date) {
      setDispo([]);
      return;
    }

    let actif = true;

    const chargerDisponibilites = async () => {
      try {
        const response = await axiosClient.get(`/rendezvous/disponibilites?date=${date}`);
        if (actif) setDispo(response.data.heuresReservees || []);
      } catch (err) {
        if (actif) setDispo([]);
      }
    };

    chargerDisponibilites();

    return () => {
      actif = false;
    };
  }, [date]);

  const serviceChoisi = services.find((s) => s._id === serviceId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!serviceId || !date || !heure) {
      setErrorMsg('Choisissez une prestation, une date et un créneau.');
      return;
    }

    try {
      setLoading(true);
      const response = await axiosClient.post('/rendezvous', {
        serviceId,
        date,
        heure,
        notes
      });

      dispatch(addRendezVous(response.data));
      dispatch(
        showToast({
          message: 'Rendez-vous enregistré ! En attente de confirmation.',
          type: 'success'
        })
      );

      setDate('');
      setHeure('');
      setNotes('');
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Erreur lors de la réservation.');
    } finally {
      setLoading(false);
    }
  };

  const estPasse = (h) => {
    if (!date) return false;
    return new Date(`${date}T${h}:00`) <= new Date();
  };

  return (
    <section className="booking-card" id="reservation">
      <div className="booking-head">
        <span className="bi">
          <Icon name="calendar" size={20} />
        </span>
        <div>
          <h3>Prendre rendez-vous</h3>
          <p>Choisissez une prestation, une date et un créneau disponible.</p>
        </div>
      </div>

      {errorMsg && (
        <div className="feedback-alert error" style={{ marginTop: 18, marginBottom: 0 }}>
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="step-label">
          <span className="step-num">1</span> Prestation
        </div>
        <div className="field" style={{ marginTop: 0 }}>
          <select id="service" value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
            {services.map((s) => (
              <option key={s._id} value={s._id}>
                {s.nom} — {s.duree} min — {formatPrix(s.prix)}
              </option>
            ))}
          </select>
        </div>

        <div className="step-label">
          <span className="step-num">2</span> Date
        </div>
        <div className="field" style={{ marginTop: 0 }}>
          <input
            id="date"
            type="date"
            min={todayISO()}
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setHeure('');
            }}
            required
          />
        </div>

        {date && (
          <>
            <div className="step-label">
              <span className="step-num">3</span> Créneau horaire
            </div>
            <div className="slot-grid">
              {HEURES.map((h) => {
                const pris = dispo.includes(h);
                const passe = estPasse(h);
                return (
                  <button
                    type="button"
                    key={h}
                    className={
                      'slot' + (heure === h ? ' active' : '') + (pris || passe ? ' taken' : '')
                    }
                    disabled={pris || passe}
                    onClick={() => setHeure(h)}
                  >
                    {h}
                    {pris && <small>pris</small>}
                    {!pris && passe && <small>passé</small>}
                  </button>
                );
              })}
            </div>
          </>
        )}

        <div className="field">
          <label htmlFor="notes">
            Message pour le coach <span className="optional">optionnel</span>
          </label>
          <textarea
            id="notes"
            rows={3}
            placeholder="Ex : Je souhaite travailler sur ma confiance en moi..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {serviceChoisi && date && heure && (
          <div className="booking-summary">
            <div className="summary-row">
              <span>Prestation</span>
              <strong>{serviceChoisi.nom}</strong>
            </div>
            <div className="summary-row">
              <span>Durée</span>
              <strong>{serviceChoisi.duree} min</strong>
            </div>
            <div className="summary-row">
              <span>Date</span>
              <strong>
                {formatDate(date)} à {heure}
              </strong>
            </div>
            <div className="summary-row total">
              <span>Tarif</span>
              <strong>{formatPrix(serviceChoisi.prix)}</strong>
            </div>
          </div>
        )}

        <button type="submit" className="btn btn-pink btn-block" disabled={loading}>
          {loading ? 'Enregistrement...' : 'Confirmer ma demande'}
          <span className="btn-arrow">
            <Icon name="arrowUp" size={13} />
          </span>
        </button>
      </form>
    </section>
  );
}
