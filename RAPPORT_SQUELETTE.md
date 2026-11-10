# Rapport de projet MERN — Élan, gestion des rendez-vous d'un coach de vie

> **Mode d'emploi de ce fichier**
> C'est une *trame* à recopier dans Word / Google Docs. Le texte entre crochets `[...]`
> indique ce que vous devez rédiger ou remplacer. Objectif : **5 à 8 pages**, hors annexes.
> Les captures d'écran se font avec `Win + Shift + S` puis se collent directement dans le document.

**Nom / Prénom :** [votre nom]
**Classe / Groupe :** [Décalé 2026-2027]
**Enseignant :** Dr. Abdelweheb GUEDDES
**Dépôt GitHub :** [lien]
**Application en ligne :** [lien Vercel] — **API :** [lien Render]

---

## 1. Introduction et problématique *(≈ ½ page)*

Un coach de vie gère aujourd'hui ses rendez-vous par téléphone ou messagerie : doubles
réservations, oublis, aucune visibilité sur son activité. L'objectif du projet est de
**digitaliser la prise de rendez-vous** avec une application web où le client réserve seul
un créneau et où le coach pilote son planning depuis un espace d'administration.

**Problématique :** comment permettre à un visiteur de réserver un créneau en moins d'une
minute, tout en garantissant la confidentialité des données et la cohérence du planning ?

**Périmètre :** trois profils (visiteur, client, administrateur) ; réservation, annulation,
avis ; gestion des prestations ; tableau de bord.

---

## 2. Étude fonctionnelle *(≈ 1 page)*

### 2.1 Acteurs et cas d'utilisation

| Acteur | Cas d'utilisation |
| --- | --- |
| Visiteur | Consulter les prestations · voir les créneaux occupés · lire les témoignages · s'inscrire / se connecter |
| Client | Réserver · consulter son historique · annuler une demande en attente · déposer un avis après séance |
| Administrateur | Tableau de bord · confirmer / terminer / annuler un RDV · CRUD prestations · consulter les comptes |

*[Insérer ici un diagramme de cas d'utilisation — draw.io ou StarUML, export PNG.]*

### 2.2 Règles de gestion

1. Un créneau (`date` + `heure`) ne peut être réservé que par **un seul** rendez-vous actif.
2. Un rendez-vous doit être **dans le futur** et porter sur une prestation **active**.
3. Un client ne peut annuler que sa propre demande, et seulement si elle est `en_attente`.
4. Un avis n'est possible qu'après une séance `termine`, une seule fois, par le client concerné.
5. Une prestation liée à au moins un rendez-vous **ne peut pas être supprimée**.

---

## 3. Architecture technique *(≈ 1 page)*

```
React (Vite) ──Axios + JWT──> Express (Node.js) ──Mongoose──> MongoDB Atlas
     │                              │
  Redux Toolkit              Middlewares : protect, adminOnly, errorHandler
```

**Architecture en trois couches (SoC)** : *Model* (schémas et validation), *Controller*
(logique métier), *Route* (URL → middleware → contrôleur). Aucune couche ne déborde sur
l'autre : un contrôleur ne connaît pas les URL, un modèle ne connaît pas `req`/`res`.

**Justification des choix :**

| Choix | Justification |
| --- | --- |
| MERN | Un seul langage (JavaScript) du navigateur à la base ; JSON natif de bout en bout. |
| MongoDB | Données peu relationnelles au départ, schéma évolutif, Atlas géré et gratuit. |
| Redux Toolkit | État partagé (utilisateur, rendez-vous, prestations) sans *prop drilling*. |
| JWT | API *stateless*, adaptée à un hébergement séparé Render / Vercel. |
| Vite | Démarrage instantané, build optimisé. |

---

## 4. Base de données *(≈ 1 page)*

*[Insérer ici le diagramme des classes / collections.]*

### 4.1 Modèles

| Collection | Champs principaux | Contraintes |
| --- | --- | --- |
| `users` | `name`, `email`, `password`, `phone`, `role` | `email` unique, `password` haché, `role` ∈ {client, admin} |
| `services` | `nom`, `description`, `duree`, `prix`, `actif` | `duree` 15–240, `prix` ≥ 0 |
| `rendezvous` | `client`, `service`, `date`, `heure`, `statut`, `notes` | `statut` ∈ {en_attente, confirme, termine, annule}, index `{date, heure}` |
| `avis` | `client`, `rendezVous`, `note`, `texte` | `rendezVous` unique, `note` 1–5 |

### 4.2 Relations

- `User (1) → RendezVous (N)` via `RendezVous.client` (`ref: 'User'`)
- `Service (1) → RendezVous (N)` via `RendezVous.service` (`ref: 'Service'`)
- `User (1) → Avis (N)` via `Avis.client`
- `RendezVous (1) → Avis (1)` via `Avis.rendezVous` (unique) + champ virtuel `avis`

Extrait commenté à reproduire dans le rapport :

```js
client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true }
```

```js
await RendezVous.find({ client: req.user._id })
  .populate('service', 'nom duree prix')
  .populate('avis');
```

**Remarque technique :** `date` est stockée en chaîne `"AAAA-MM-JJ"` et `heure` en `"HH:MM"`.
Ce choix supprime les décalages de fuseau horaire et rend le tri lexicographique exact.

---

## 5. Réalisation — back-end *(≈ 1,5 page)*

### 5.1 Authentification

```js
const salt = await bcrypt.genSalt(10);
const hashedPassword = await bcrypt.hash(password, salt);
// ...
const isMatch = await bcrypt.compare(password, user.password);
```

Le token contient `{ id, role }` et expire au bout d'un jour :

```js
jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '1d' });
```

### 5.2 Middleware `protect`

1. Lit `Authorization: Bearer <token>` ; 2. vérifie la signature ; 3. **recharge l'utilisateur
en base** (`.select('-password')`) ; 4. distingue `TokenExpiredError` des autres erreurs.
`adminOnly` s'exécute ensuite et renvoie `403` si `role !== 'admin'`.

### 5.3 Contrôleurs et règles métier

*[Décrire 3 extraits : création d'un rendez-vous (contrôle du futur, de la prestation active,
du conflit 409), mise à jour (client limité à l'annulation), suppression en cascade de l'avis.]*

```js
const conflit = await RendezVous.findOne({
  date, heure, statut: { $in: ['en_attente', 'confirme'] }
});
if (conflit) return res.status(409).json({ message: 'Ce creneau est deja reserve' });
```

### 5.4 Gestion centralisée des erreurs

`notFound` transforme toute URL inconnue en erreur, `errorHandler` traduit `CastError` → 400,
`ValidationError` → 400, doublon `11000` → 409. Le client reçoit donc toujours un JSON
`{ message }` exploitable.

---

## 6. Réalisation — front-end *(≈ 1,5 page)*

### 6.1 Structure

`App.jsx` gère trois vues (`accueil`, `mes-rdv`, `admin`) selon le rôle contenu dans `authSlice`.
`main.jsx` enveloppe l'application dans le `Provider` Redux.

### 6.2 Intercepteur Axios

```js
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

Aucun composant ne manipule le token : le token est posé une fois, automatiquement.

### 6.3 État global (5 slices)

| Slice | Contenu | Actions |
| --- | --- | --- |
| `auth` | `user`, `token` | `loginSuccess`, `logout` |
| `rendezVous` | `items`, `loading`, `error` | `setRendezVous`, `addRendezVous`, `updateRendezVous`, `removeRendezVous` |
| `services` | catalogue | `setServices`, `addService`, `updateService`, `removeService` |
| `avis` | témoignages | `setAvis`, `addAvis`, `removeAvis` |
| `ui` | `toast`, `selectedServiceId` | `showToast`, `clearToast`, `selectService` |

`ui.selectedServiceId` évite le *prop drilling* entre la carte de prestation et le formulaire
de réservation.

### 6.4 Parcours de réservation

`BookingForm` : sélection de la prestation → choix de la date → `GET /rendezvous/disponibilites`
→ créneaux déjà pris grisés → `POST /rendezvous` → `dispatch(addRendezVous(...))` + toast.
Un `useEffect` de nettoyage (`let actif = false`) évite les mises à jour sur composant démonté.

### 6.5 Panneau d'administration

Quatre onglets : *Tableau de bord* (statistiques, CA, prochains RDV), *Rendez-vous* (filtres
statut + recherche client, boutons Confirmer / Terminer / Annuler / Supprimer), *Prestations*
(formulaire CRUD + activation/désactivation), *Clients* (comptes, sans mots de passe).

*[Insérer 3 à 5 captures : accueil, réservation avec créneaux, mes rendez-vous, tableau de bord admin, gestion des prestations.]*

---

## 7. Sécurité *(≈ ½ page)*

| Menace | Contre-mesure |
| --- | --- |
| Vol de mot de passe en base | Hachage bcrypt + sel (facteur 10) |
| Usurpation d'identité | `client` déduit du token, jamais du `req.body` |
| Accès aux données d'autrui | Vérification propriétaire ou admin → 403 |
| Élévation de privilèges | `role` forcé à `client` à l'inscription ; `adminOnly` sur les écritures |
| Fuite de secrets | `.env` ignoré par Git ; `.env.example` fourni |
| Injection NoSQL | `express.json()` + validation Mongoose + `CastError` gérée |
| Session infinie | Token expirant (1 jour) et message dédié à l'expiration |

---

## 8. Tests et validation *(≈ ½ page)*

*[Décrire les tests réalisés. Un tableau suffit, avec Postman ou le navigateur.]*

| # | Scénario | Résultat attendu | Obtenu |
| --- | --- | --- | --- |
| 1 | Inscription avec email déjà utilisé | 409 | ☐ |
| 2 | Connexion mauvais mot de passe | 401 | ☐ |
| 3 | POST `/rendezvous` sans token | 401 | ☐ |
| 4 | POST `/rendezvous` dans le passé | 400 | ☐ |
| 5 | Réservation d'un créneau déjà pris | 409 | ☐ |
| 6 | Client appelle `/rendezvous` (liste admin) | 403 | ☐ |
| 7 | Avis sur un rendez-vous non terminé | 400 | ☐ |
| 8 | Suppression d'une prestation liée | 400 | ☐ |
| 9 | Suppression d'un RDV par un autre client | 403 | ☐ |
| 10 | Token expiré / modifié | 401 + message | ☐ |

---

## 9. Déploiement *(≈ ½ page)*

- **Base** : MongoDB Atlas (cluster M0), utilisateur dédié, accès réseau `0.0.0.0/0`.
- **API** : Render, *Root Directory* `server`, build `npm install`, start `npm start`,
  variables `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL`.
- **Front** : Vercel, *Root Directory* `client`, framework Vite, `VITE_API_URL` = URL Render + `/api`.
- **Recette** : après déploiement, un rendez-vous créé depuis Vercel est visible dans le
  tableau de bord Render → la chaîne complète fonctionne.

*[Insérer une capture du service Render et une du projet Vercel.]*

---

## 10. Bilan et perspectives *(≈ ½ page)*

**Réalisé :** application complète et déployée, 4 modèles, 4 relations, authentification JWT,
contrôle d'accès par rôle, panneau d'administration, 20+ routes REST.

**Difficultés rencontrées :**
- *[ex. : décalage d'un jour sur les dates → passage aux chaînes `AAAA-MM-JJ`]*
- *[ex. : double réservation en cas de clics simultanés → revérification serveur + index]*
- *[ex. : CORS Render/Vercel → variable `CLIENT_URL`]*

**Perspectives :** notifications email (Nodemailer), paiement en ligne, calendrier mensuel,
export CSV, mots de passe oubliés, tests automatisés (Jest + Supertest).

---

## Annexes

- **A.** Captures d'écran supplémentaires
- **B.** Collection Postman exportée
- **C.** Extrait du fichier `.env.example`
- **D.** Lien du dépôt GitHub et de l'application en ligne
