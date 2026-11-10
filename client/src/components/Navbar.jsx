import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../redux/authSlice';
import { initiales } from '../utils/format';
import Icon from './Icon';
import Flower from './Flower';

export default function Navbar({ view, onNavigate }) {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { items } = useSelector((state) => state.rendezVous);

  const isAdmin = user && user.role === 'admin';
  const allerAccueil = () => onNavigate(isAdmin ? 'admin' : 'accueil');

  return (
    <div className="nav-wrap">
      <nav className="nav">
        <button className="brand" onClick={allerAccueil} aria-label="Retour à l'accueil">
          <span className="brand-mark">
            <Flower size={30} />
          </span>
          <span>
            <span className="brand-name">élan</span>
            <span className="brand-tag">coach de vie</span>
          </span>
        </button>

        <div className="nav-links">
          {!isAdmin && (
            <button
              className={view === 'accueil' ? 'nav-link active' : 'nav-link'}
              onClick={() => onNavigate('accueil')}
            >
              Accueil
            </button>
          )}

          {user && !isAdmin && (
            <button
              className={view === 'mes-rdv' ? 'nav-link active' : 'nav-link'}
              onClick={() => onNavigate('mes-rdv')}
            >
              Mes rendez-vous
              <span className="nav-count">{items.length}</span>
            </button>
          )}

          {isAdmin && (
            <button
              className={view === 'admin' ? 'nav-link active' : 'nav-link'}
              onClick={() => onNavigate('admin')}
            >
              Administration
            </button>
          )}
        </div>

        {user ? (
          <div className="user-chip">
            <span className={isAdmin ? 'avatar' : 'avatar pink'}>{initiales(user.name)}</span>
            <span className="user-meta">
              <strong>{user.name}</strong>
              <span>{isAdmin ? 'Admin' : 'Client'}</span>
            </span>
            <button
              className="icon-btn"
              onClick={() => dispatch(logout())}
              title="Se déconnecter"
              aria-label="Se déconnecter"
            >
              <Icon name="logout" size={17} />
            </button>
          </div>
        ) : (
          <button className="btn btn-pink btn-sm" onClick={() => onNavigate('auth')}>
            Se connecter
            <span className="btn-arrow">
              <Icon name="arrowUp" size={13} />
            </span>
          </button>
        )}
      </nav>
    </div>
  );
}
