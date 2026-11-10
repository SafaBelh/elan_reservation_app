import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axiosClient from '../../api/axiosClient';
import {
  setServices,
  addService,
  updateService,
  removeService,
  setLoading,
  setError
} from '../../redux/serviceSlice';
import { showToast } from '../../redux/uiSlice';
import { formatPrix } from '../../utils/format';
import Icon from '../Icon';

const FORM_VIDE = {
  nom: '',
  description: '',
  duree: 60,
  prix: 120,
  actif: true
};

export default function AdminServices() {
  const dispatch = useDispatch();
  const { items, loading } = useSelector((state) => state.services);

  const [form, setForm] = useState(FORM_VIDE);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  // Recharge le catalogue complet (y compris prestations inactives)
  useEffect(() => {
    const charger = async () => {
      try {
        dispatch(setLoading(true));
        const response = await axiosClient.get('/services');
        dispatch(setServices(response.data));
      } catch (err) {
        dispatch(setError('Impossible de charger les prestations.'));
      }
    };

    charger();
  }, [dispatch]);

  const changerChamp = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const reinitialiser = () => {
    setForm(FORM_VIDE);
    setEditId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      nom: form.nom.trim(),
      description: form.description.trim(),
      duree: Number(form.duree),
      prix: Number(form.prix),
      actif: form.actif
    };

    try {
      setSaving(true);

      if (editId) {
        const response = await axiosClient.put(`/services/${editId}`, payload);
        dispatch(updateService(response.data));
        dispatch(showToast({ message: 'Prestation mise à jour.', type: 'success' }));
      } else {
        const response = await axiosClient.post('/services', payload);
        dispatch(addService(response.data));
        dispatch(showToast({ message: 'Prestation créée.', type: 'success' }));
      }

      reinitialiser();
    } catch (err) {
      dispatch(
        showToast({
          message: err.response?.data?.message || "Erreur lors de l'enregistrement.",
          type: 'error'
        })
      );
    } finally {
      setSaving(false);
    }
  };

  const editer = (service) => {
    setEditId(service._id);
    setForm({
      nom: service.nom,
      description: service.description,
      duree: service.duree,
      prix: service.prix,
      actif: service.actif
    });
    document.getElementById('service-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const basculerActif = async (service) => {
    try {
      const response = await axiosClient.put(`/services/${service._id}`, {
        actif: !service.actif
      });
      dispatch(updateService(response.data));
      dispatch(
        showToast({
          message: service.actif ? 'Prestation désactivée.' : 'Prestation activée.',
          type: 'info'
        })
      );
    } catch (err) {
      dispatch(showToast({ message: 'Erreur lors du changement de statut.', type: 'error' }));
    }
  };

  const supprimer = async (service) => {
    if (!window.confirm(`Supprimer la prestation "${service.nom}" ?`)) return;

    try {
      await axiosClient.delete(`/services/${service._id}`);
      dispatch(removeService(service._id));
      dispatch(showToast({ message: 'Prestation supprimée.', type: 'info' }));
    } catch (err) {
      // Ex : 400 si des rendez-vous sont lies (integrite referentielle)
      dispatch(
        showToast({
          message: err.response?.data?.message || 'Erreur lors de la suppression.',
          type: 'error'
        })
      );
    }
  };

  return (
    <div className="admin-content admin-columns">
      <section className="panel" id="service-form">
        <div className="panel-head">
          <div>
            <h3>{editId ? 'Modifier une prestation' : 'Nouvelle prestation'}</h3>
            <p className="panel-sub">
              {editId
                ? 'Ajustez les informations puis enregistrez.'
                : 'Ajoutez une séance au catalogue visible par les clients.'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="field" style={{ marginTop: 0 }}>
            <label htmlFor="svc-nom">Nom</label>
            <input
              id="svc-nom"
              name="nom"
              type="text"
              value={form.nom}
              onChange={changerChamp}
              placeholder="Ex : Coaching individuel"
              required
            />
          </div>

          <div className="field">
            <label htmlFor="svc-desc">Description</label>
            <textarea
              id="svc-desc"
              name="description"
              rows={3}
              value={form.description}
              onChange={changerChamp}
              placeholder="En quoi consiste cette séance ?"
              required
            />
          </div>

          <div className="form-row">
            <div className="field">
              <label htmlFor="svc-duree">Durée (min)</label>
              <input
                id="svc-duree"
                name="duree"
                type="number"
                min={15}
                max={240}
                value={form.duree}
                onChange={changerChamp}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="svc-prix">Prix (TND)</label>
              <input
                id="svc-prix"
                name="prix"
                type="number"
                min={0}
                value={form.prix}
                onChange={changerChamp}
                required
              />
            </div>
          </div>

          <label className="checkbox-row">
            <input
              name="actif"
              type="checkbox"
              checked={form.actif}
              onChange={changerChamp}
            />
            Prestation visible par les clients
          </label>

          <div className="form-actions">
            <button type="submit" className="btn btn-pink" disabled={saving}>
              {saving ? 'Enregistrement...' : editId ? 'Enregistrer' : 'Créer la prestation'}
              <span className="btn-arrow">
                <Icon name="arrowUp" size={13} />
              </span>
            </button>
            {editId && (
              <button type="button" className="btn btn-ghost" onClick={reinitialiser}>
                Annuler
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div className="panel-title-row">
            <h3>Catalogue</h3>
            <span className="count-pill">{items.length}</span>
          </div>
          <span className="panel-sub">{items.filter((s) => s.actif).length} active(s)</span>
        </div>

        {loading && <div className="loading-box">Chargement...</div>}

        <div className="service-admin-list">
          {items.map((service) => (
            <div className="service-admin-item" key={service._id}>
              <div>
                <span className="svc-name">
                  <span className={service.actif ? 'svc-dot' : 'svc-dot off'} />
                  {service.nom}
                </span>
                <span className="cell-sub">
                  {service.duree} min &middot; {formatPrix(service.prix)} &middot;{' '}
                  {service.actif ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="table-actions">
                <button className="btn btn-ghost btn-xs" onClick={() => editer(service)}>
                  Modifier
                </button>
                <button
                  className={service.actif ? 'btn btn-soft-gold btn-xs' : 'btn btn-soft-pink btn-xs'}
                  onClick={() => basculerActif(service)}
                >
                  {service.actif ? 'Désactiver' : 'Activer'}
                </button>
                <button
                  className="icon-btn"
                  onClick={() => supprimer(service)}
                  title="Supprimer"
                  aria-label="Supprimer la prestation"
                >
                  <Icon name="trash" size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
