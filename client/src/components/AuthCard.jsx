import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import axiosClient from '../api/axiosClient';
import { loginSuccess } from '../redux/authSlice';
import { showToast } from '../redux/uiSlice';
import Flower from './Flower';
import Icon from './Icon';

export default function AuthCard({ onNavigate }) {
  // "login" ou "register" (Defi 2 de la Seance 6)
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [voirMotDePasse, setVoirMotDePasse] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      setLoading(true);

      // 1. Construire la requete selon le mode choisi
      const url = mode === 'login' ? '/auth/login' : '/auth/register';
      const payload =
        mode === 'login'
          ? { email, password }
          : { name, email, password, phone };

      // 2. Appeler le serveur Express
      const response = await axiosClient.post(url, payload);

      // 3. Ranger l'utilisateur et son Token JWT dans Redux + localStorage
      dispatch(loginSuccess(response.data));
      dispatch(
        showToast({
          message:
            mode === 'login'
              ? `Bienvenue ${response.data.user.name} !`
              : 'Compte créé avec succès, vous êtes connecté !',
          type: 'success'
        })
      );
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Erreur de connexion au serveur Express.');
    } finally {
      setLoading(false);
    }
  };

  const remplirCompte = (type) => {
    setMode('login');
    setEmail(type === 'admin' ? 'admin@elan.tn' : 'client@elan.tn');
    setPassword(type === 'admin' ? 'admin123' : 'client123');
    setErrorMsg('');
  };

  return (
    <div className="auth-page">
      {/* ---------------- Panneau visuel ---------------- */}
      <aside className="auth-visual">
        <div className="auth-logo">
          <span className="auth-logo-mark">
            <Flower size={30} />
          </span>
          élan
        </div>

        <div className="auth-visual-center">
          <div className="auth-orbit">
            <span className="auth-ring r1" />
            <span className="auth-ring r2" />
            <span className="auth-halo" />
            <Flower size={300} className="auth-flower" />
          </div>

          <span className="auth-pill p1">
            <span className="ok">
              <Icon name="check" size={13} strokeWidth={2.6} />
            </span>
            Séance confirmée &middot; jeudi 10:00
          </span>

          <span className="auth-pill p2">
            <span className="spark">
              <Icon name="sparkle" size={13} />
            </span>
            Nouvel objectif posé
          </span>

          <span className="auth-pill p3">
            <span className="spark" style={{ background: '#f0568b', color: '#fff' }}>
              <Icon name="heart" size={12} filled />
            </span>
            Un pas de plus vers l'équilibre
          </span>
        </div>

        <figure className="auth-quote-block">
          <span className="auth-quote-mark" aria-hidden="true">&ldquo;</span>
          <blockquote className="auth-quote">
            Le premier pas n'est pas de tout changer,{' '}
            <span className="accent">c'est de voir clair.</span>
          </blockquote>
          <figcaption className="auth-quote-by">Élan &middot; coach de vie</figcaption>
        </figure>
      </aside>

      {/* ---------------- Formulaire ---------------- */}
      <section className="auth-side">
        <button className="auth-back" onClick={() => onNavigate('accueil')}>
          <Icon name="arrowLeft" size={15} />
          Retour à l'accueil
        </button>

        <div className="auth-form-wrap">
          <h1 className="auth-title">
            {mode === 'login' ? 'Bon retour parmi nous.' : 'Faisons connaissance.'}
          </h1>
          <p className="auth-sub">
            {mode === 'login'
              ? 'Connectez-vous pour réserver, annuler ou commenter vos séances.'
              : 'Créez votre compte client en quelques secondes.'}
          </p>

          <div className="segmented">
            <button
              type="button"
              className={mode === 'login' ? 'active' : ''}
              onClick={() => {
                setMode('login');
                setErrorMsg('');
              }}
            >
              Connexion
            </button>
            <button
              type="button"
              className={mode === 'register' ? 'active' : ''}
              onClick={() => {
                setMode('register');
                setErrorMsg('');
              }}
            >
              Créer un compte
            </button>
          </div>

          {errorMsg && (
            <div className="feedback-alert error" style={{ marginTop: 20, marginBottom: 0 }}>
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {mode === 'register' && (
              <div className="field">
                <label htmlFor="name">Nom complet</label>
                <input
                  id="name"
                  type="text"
                  placeholder="Ex : Aya Ben Amor"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="field">
              <label htmlFor="email">Adresse email</label>
              <input
                id="email"
                type="email"
                placeholder="client@elan.tn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="password">Mot de passe</label>
              <div className="input-with-icon">
                <input
                  id="password"
                  type={voirMotDePasse ? 'text' : 'password'}
                  placeholder="6 caractères minimum"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  className="peek"
                  onClick={() => setVoirMotDePasse((v) => !v)}
                  aria-label={voirMotDePasse ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  <Icon name="eye" size={17} />
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <div className="field">
                <label htmlFor="phone">
                  Téléphone <span className="optional">optionnel</span>
                </label>
                <input
                  id="phone"
                  type="text"
                  placeholder="+216 22 111 222"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            )}

            <button type="submit" className="btn btn-pink auth-submit" disabled={loading}>
              {loading ? 'Vérification...' : mode === 'login' ? 'Se connecter' : "S'inscrire"}
              <span className="btn-arrow">
                <Icon name="arrowUp" size={14} />
              </span>
            </button>
          </form>

          <div className="divider-soft" />

          <div className="demo-row">
            <span className="demo-label">Accès démo</span>
            <button type="button" className="demo-chip" onClick={() => remplirCompte('client')}>
              <Icon name="heart" size={14} className="heart" />
              Client
            </button>
            <button type="button" className="demo-chip" onClick={() => remplirCompte('admin')}>
              <Icon name="sparkle" size={14} />
              Coach admin
            </button>
          </div>

          <p className="auth-foot">
            <Icon name="lock" size={13} />
            Connexion sécurisée par jeton JWT
          </p>
        </div>
      </section>
    </div>
  );
}
