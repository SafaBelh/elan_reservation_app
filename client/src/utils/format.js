// ==============================================================================
// src/utils/format.js
// Petites fonctions et constantes partagees par les composants.
// ==============================================================================

// Creneaux proposes par le coach (13:00 = pause dejeuner)
export const HEURES = [
  '09:00', '10:00', '11:00', '12:00',
  '14:00', '15:00', '16:00', '17:00', '18:00'
];

// Libelles et classes CSS des statuts
export const STATUTS = {
  en_attente: { label: 'En attente', className: 'status-pending' },
  confirme: { label: 'Confirmé', className: 'status-confirmed' },
  termine: { label: 'Terminé', className: 'status-done' },
  annule: { label: 'Annulé', className: 'status-cancelled' }
};

// Couleurs utilisees par les graphiques (memes teintes que la charte)
export const COULEURS_STATUT = {
  en_attente: '#f2b13c',
  confirme: '#7b4dff',
  termine: '#2fa37b',
  annule: '#f0568b'
};

// "2026-11-15" -> "dimanche 15 novembre 2026"
export function formatDate(date) {
  if (!date) return '';
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

// "2026-11-15" -> { dow: "ven.", day: 15, mon: "nov." }
export function morceauxDate(date) {
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return { dow: '', day: '', mon: '' };
  return {
    dow: d.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', ''),
    day: d.getDate(),
    mon: d.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '')
  };
}

// Date du jour au format "AAAA-MM-JJ" (valeur minimale des champs date)
export function todayISO() {
  const d = new Date();
  const mois = String(d.getMonth() + 1).padStart(2, '0');
  const jour = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mois}-${jour}`;
}

// "2026-11-15" -> 3 (nombre de jours qui separent la date d'aujourd'hui)
export function joursRestants(date) {
  const cible = new Date(`${date}T00:00:00`);
  const aujourdhui = new Date(`${todayISO()}T00:00:00`);
  return Math.round((cible - aujourdhui) / 86400000);
}

// "2026-11-15" -> "15/11/2026"
export function formatDateCourt(date) {
  if (!date) return '';
  const [a, m, j] = date.split('-');
  return `${j}/${m}/${a}`;
}

export function formatPrix(prix) {
  if (prix === 0 || prix === '0') return 'Gratuit';
  if (prix === undefined || prix === null) return '—';
  return `${prix} TND`;
}

// Etoiles d'une note (1 a 5)
export function etoiles(note) {
  return '★'.repeat(note) + '☆'.repeat(5 - note);
}

// "Aya Ben Amor" -> "AB"
export function initiales(nom = '') {
  return nom
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((mot) => mot[0].toUpperCase())
    .join('');
}

// Les 6 derniers mois : [{ key: "2026-11", label: "nov." }, ...]
const MOIS_COURTS = ['janv.', 'fevr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'aout', 'sept.', 'oct.', 'nov.', 'dec.'];

export function sixDerniersMois() {
  const base = new Date();
  const liste = [];

  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(base.getFullYear(), base.getMonth() - i, 1);
    liste.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: MOIS_COURTS[d.getMonth()]
    });
  }

  return liste;
}

// "vendredi 13 novembre 2026" -> "ven. 13 nov."
export function formatDateMini(date) {
  const { dow, day, mon } = morceauxDate(date);
  return `${dow}. ${day} ${mon}.`;
}
