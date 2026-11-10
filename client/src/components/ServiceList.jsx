import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectService, showToast } from '../redux/uiSlice';
import { formatPrix } from '../utils/format';
import Icon from './Icon';

// Choisit une icone en fonction du nom de la prestation
function iconePour(nom = '') {
  const n = nom.toLowerCase();
  if (n.includes('stress') || n.includes('burn')) return 'sparkle';
  if (n.includes('carri') || n.includes('profession')) return 'heart';
  if (n.includes('bilan')) return 'compass';
  if (n.includes('individuel') || n.includes('coaching')) return 'leaf';
  return 'sparkle';
}

const TONS = ['violet', 'gold', 'green', 'pink'];

export default function ServiceList({ onNavigate }) {
  const dispatch = useDispatch();
  const { items, loading, error } = useSelector((state) => state.services);
  const { user } = useSelector((state) => state.auth);

  const services = items.filter((s) => s.actif);
  const vedette = services[0];
  const autres = services.slice(1);

  const handleSelect = (service) => {
    dispatch(selectService(service._id));

    if (!user) {
      dispatch(showToast({ message: 'Connectez-vous pour réserver cette séance.', type: 'info' }));
      onNavigate('auth');
    } else {
      document.getElementById('reservation')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  if (loading) {
    return <div className="loading-box">Chargement des prestations...</div>;
  }

  if (error || services.length === 0) {
    return (
      <div className="feedback-alert error" style={{ marginBottom: 0 }}>
        {error || 'Prestations indisponibles pour le moment.'}
      </div>
    );
  }

  return (
    <div className="service-grid">
      {vedette && (
        <article className="service-featured">
          <div>
            <div className="service-top">
              <span className="service-icon">
                <Icon name={iconePour(vedette.nom)} size={22} />
              </span>
              <span className="price-pill">{formatPrix(vedette.prix)}</span>
            </div>

            <h3 className="service-name">{vedette.nom}</h3>
            <p className="service-desc">{vedette.description}</p>

            <div className="service-meta" style={{ marginTop: 16 }}>
              <span className="chip">
                <Icon name="clock" size={13} />
                {vedette.duree} min
              </span>
              <span className="chip">Visio / Cabinet</span>
            </div>
          </div>

          <div className="service-buy">
            <button className="btn btn-light btn-block" onClick={() => handleSelect(vedette)}>
              Réserver cette séance
              <span className="btn-arrow pink">
                <Icon name="arrowUp" size={13} />
              </span>
            </button>
          </div>
        </article>
      )}

      {autres.map((service, index) => (
        <article className={`service-card tone-${TONS[index % TONS.length]}`} key={service._id}>
          <div className="service-top">
            <span className="service-icon">
              <Icon name={iconePour(service.nom)} size={22} />
            </span>
            <span className="price-pill">{formatPrix(service.prix)}</span>
          </div>

          <h3 className="service-name">{service.nom}</h3>
          <p className="service-desc">{service.description}</p>

          <div className="service-meta">
            <span className="chip">
              <Icon name="clock" size={13} />
              {service.duree} min
            </span>
            <span className="chip">Visio / Cabinet</span>
          </div>

          <div className="service-buy">
            <button className="btn btn-dark btn-block" onClick={() => handleSelect(service)}>
              Réserver cette séance
              <span className="btn-arrow">
                <Icon name="arrowUp" size={13} />
              </span>
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
