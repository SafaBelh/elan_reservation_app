import React from 'react';
import { useSelector } from 'react-redux';
import Flower from './Flower';
import Icon from './Icon';

const MOTS = ['Sens', 'Énergie', 'Joie', 'Audace', 'Clarté', 'Confiance', 'Équilibre', 'Transition'];

export default function Hero({ onNavigate }) {
  const { user } = useSelector((state) => state.auth);
  const { items } = useSelector((state) => state.services);

  // Compteur dynamique : reste juste meme si l'admin ajoute une prestation
  const nbPrestations = items.filter((s) => s.actif).length;

  const descendreVers = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const actionPrincipale = () => {
    if (user) {
      descendreVers('reservation');
    } else {
      onNavigate('auth');
    }
  };

  return (
    <>
      <header className="hero">
        <div className="wrap hero-inner">
          <div className="hero-copy">
            <h1 className="hero-title">
              Retrouvez
              <br />
              votre <span className="accent">élan</span>, une
              <br />
              séance à la fois.
            </h1>

            <p className="hero-sub">
              Un accompagnement bienveillant et concret pour clarifier vos objectifs,
              traverser un changement ou retrouver votre équilibre. Réservez votre
              créneau en ligne en moins d'une minute.
            </p>

            <div className="hero-cta">
              <button className="btn btn-pink" onClick={actionPrincipale}>
                {user ? 'Réserver une séance' : 'Se connecter pour réserver'}
                <span className="btn-arrow">
                  <Icon name="arrowUp" size={14} />
                </span>
              </button>
            </div>

            <p className="hero-note">
              <Icon name="compass" size={16} />
              Coaching de vie à Tunis &middot; en visio ou au cabinet
            </p>
          </div>

          <div className="hero-art">
            <span className="hero-glow" aria-hidden="true" />

            <div className="float-card top">
              <span className="float-label">Le cabinet en chiffres</span>
              <span className="float-big">{nbPrestations}</span>
              <span className="float-small">prestations actives<br />à réserver</span>
            </div>

            <Flower size={340} className="hero-flower" />

            <svg className="hero-badge" viewBox="0 0 120 120" aria-hidden="true">
              <defs>
                <path
                  id="badge-cercle"
                  d="M60,60 m-42,0 a42,42 0 1,1 84,0 a42,42 0 1,1 -84,0"
                  fill="none"
                />
              </defs>
              <circle cx="60" cy="60" r="58" fill="#f2b13c" />
              <text
                fill="#4a3200"
                fontSize="9"
                fontWeight="700"
                letterSpacing="2.6"
                fontFamily="Inter, sans-serif"
              >
                <textPath href="#badge-cercle" startOffset="2">
                  BIENVEILLANT · CONFIDENTIEL ·
                </textPath>
              </text>
              <circle cx="60" cy="60" r="21" fill="#2b1a33" />
              <path
                d="M60 51.5c3.1 0 5.4 2.2 5.4 5.2 0 4.2-5.4 8.8-5.4 8.8s-5.4-4.6-5.4-8.8c0-3 2.3-5.2 5.4-5.2z"
                fill="#ef4d7f"
              />
            </svg>

            <div className="float-card bottom">
              <span className="float-icon">
                <Icon name="clock" size={18} />
              </span>
              <span>
                <span className="float-big" style={{ fontSize: 26, margin: 0 }}>
                  1h
                </span>
                <span className="float-small">d'écoute active<br />par séance</span>
              </span>
            </div>

            <p className="hero-quote">
              &laquo; Le premier pas n'est pas de tout changer, c'est de voir clair. &raquo;
            </p>
          </div>
        </div>
      </header>

      <div className="marquee" aria-hidden="true">
        <div className="marquee-track">
          {[...MOTS, ...MOTS].map((mot, index) => (
            <React.Fragment key={`${mot}-${index}`}>
              <span className="marquee-item">{mot}</span>
              <span className="marquee-star">✦</span>
            </React.Fragment>
          ))}
        </div>
      </div>
    </>
  );
}
