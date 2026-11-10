import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axiosClient from '../../api/axiosClient';
import {
  setRendezVous,
  updateRendezVous,
  removeRendezVous,
  setLoading,
  setError
} from '../../redux/rendezVousSlice';
import { showToast } from '../../redux/uiSlice';
import { STATUTS, formatDate, formatPrix, initiales } from '../../utils/format';
import Icon from '../Icon';

export default function AdminRendezVous() {
  const dispatch = useDispatch();
  const { items, loading } = useSelector((state) => state.rendezVous);

  const [filtre, setFiltre] = useState('tous');
  const [recherche, setRecherche] = useState('');

  const rafraichir = async () => {
    try {
      dispatch(setLoading(true));
      const response = await axiosClient.get('/rendezvous');
      dispatch(setRendezVous(response.data));
    } catch (err) {
      dispatch(setError('Impossible de charger les rendez-vous.'));
      dispatch(showToast({ message: 'Serveur Express injoignable.', type: 'error' }));
    }
  };

  const changerStatut = async (rdv, statut) => {
    try {
      const response = await axiosClient.put(`/rendezvous/${rdv._id}`, { statut });
      dispatch(updateRendezVous(response.data));
      dispatch(
        showToast({
          message: `Rendez-vous ${STATUTS[statut]?.label.toLowerCase() || statut}.`,
          type: 'success'
        })
      );
    } catch (err) {
      dispatch(
        showToast({
          message: err.response?.data?.message || 'Erreur lors du changement de statut.',
          type: 'error'
        })
      );
    }
  };

  const supprimer = async (rdv) => {
    const message = `Supprimer définitivement le rendez-vous de ${rdv.client?.name || 'ce client'} ?`;
    if (!window.confirm(message)) return;

    try {
      await axiosClient.delete(`/rendezvous/${rdv._id}`);
      dispatch(removeRendezVous(rdv._id));
      dispatch(showToast({ message: 'Rendez-vous supprimé.', type: 'info' }));
    } catch (err) {
      dispatch(
        showToast({
          message: err.response?.data?.message || 'Erreur lors de la suppression.',
          type: 'error'
        })
      );
    }
  };

  const visibles = items.filter((rdv) => {
    const matchStatut = filtre === 'tous' || rdv.statut === filtre;
    const nom = rdv.client?.name?.toLowerCase() || '';
    const matchRecherche = nom.includes(recherche.toLowerCase());
    return matchStatut && matchRecherche;
  });

  return (
    <div className="admin-content">
      <div className="filter-bar">
        <div className="filter-group">
          <label htmlFor="filtre-statut">Statut</label>
          <select
            id="filtre-statut"
            value={filtre}
            onChange={(e) => setFiltre(e.target.value)}
          >
            <option value="tous">Tous les rendez-vous</option>
            <option value="en_attente">En attente</option>
            <option value="confirme">Confirmés</option>
            <option value="termine">Terminés</option>
            <option value="annule">Annulés</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="recherche-client">Rechercher un client</label>
          <div className="search-box">
            <Icon name="search" size={16} />
            <input
              id="recherche-client"
              type="text"
              placeholder="Nom du client..."
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
            />
          </div>
        </div>

        <button className="btn btn-ghost btn-sm" onClick={rafraichir} disabled={loading}>
          <Icon name="refresh" size={14} />
          {loading ? 'Chargement...' : 'Rafraîchir'}
        </button>
      </div>

      {visibles.length === 0 ? (
        <div className="empty-state">
          <p>Aucun rendez-vous ne correspond à ce filtre.</p>
          <p className="empty-sub">Essayez un autre statut ou videz la recherche.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Prestation</th>
                <th>Date</th>
                <th>Heure</th>
                <th>Tarif</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((rdv) => {
                const statut = STATUTS[rdv.statut] || STATUTS.en_attente;
                return (
                  <tr key={rdv._id}>
                    <td>
                      <div className="cell-client">
                        <span className="t-avatar">{initiales(rdv.client?.name)}</span>
                        <span>
                          <strong>{rdv.client?.name || 'Client'}</strong>
                          <span className="cell-sub">{rdv.client?.email}</span>
                        </span>
                      </div>
                    </td>
                    <td>{rdv.service?.nom || 'Prestation'}</td>
                    <td>{formatDate(rdv.date)}</td>
                    <td>{rdv.heure}</td>
                    <td>{formatPrix(rdv.service?.prix || 0)}</td>
                    <td>
                      <span className={`status-badge ${statut.className}`}>{statut.label}</span>
                    </td>
                    <td>
                      <div className="table-actions">
                        {rdv.statut === 'en_attente' && (
                          <button
                            className="btn btn-pink btn-xs"
                            onClick={() => changerStatut(rdv, 'confirme')}
                          >
                            <Icon name="check" size={12} strokeWidth={2.4} />
                            Confirmer
                          </button>
                        )}
                        {rdv.statut === 'confirme' && (
                          <button
                            className="btn btn-soft-gold btn-xs"
                            onClick={() => changerStatut(rdv, 'termine')}
                          >
                            <Icon name="check" size={12} strokeWidth={2.4} />
                            Terminer
                          </button>
                        )}
                        {(rdv.statut === 'en_attente' || rdv.statut === 'confirme') && (
                          <button
                            className="btn btn-soft-pink btn-xs"
                            onClick={() => changerStatut(rdv, 'annule')}
                          >
                            Annuler
                          </button>
                        )}
                        <button
                          className="icon-btn"
                          onClick={() => supprimer(rdv)}
                          title="Supprimer"
                          aria-label="Supprimer le rendez-vous"
                        >
                          <Icon name="trash" size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
