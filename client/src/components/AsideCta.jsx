import React from 'react';
import Flower from './Flower';
import Icon from './Icon';

// Carte affichee a droite des prestations pour un visiteur.
export default function AsideCta({ onNavigate }) {
  return (
    <div className="aside-cta">
      <Flower size={128} className="aside-flower" />

      <h3>
        Votre prochaine séance commence <span className="accent">ici.</span>
      </h3>

      <p className="aside-text">
        Connectez-vous pour réserver un créneau, suivre vos rendez-vous et laisser
        un avis après chaque séance.
      </p>

      <div className="aside-feature">
        <span className="fi">
          <Icon name="calendar" size={17} />
        </span>
        <span>Créneaux disponibles en temps réel</span>
      </div>

      <div className="aside-feature">
        <span className="fi">
          <Icon name="activity" size={17} />
        </span>
        <span>Un tableau de bord pour suivre votre parcours</span>
      </div>

      <div className="aside-feature">
        <span className="fi">
          <Icon name="lock" size={17} />
        </span>
        <span>Espace membre sécurisé</span>
      </div>

      <button className="btn btn-block" onClick={() => onNavigate('auth')}>
        Se connecter ou créer un compte
        <span className="btn-arrow pink">
          <Icon name="arrowUp" size={13} />
        </span>
      </button>
    </div>
  );
}
