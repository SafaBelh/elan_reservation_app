# Élan — Gestion des rendez-vous d'un coach de vie

Application **MERN** (MongoDB · Express · React · Node.js) de prise de rendez-vous en ligne
pour un coach de vie, avec **espace client** et **panneau d'administration**.

> Projet MERN — École Polytechnique de Sousse
> Dr. Abdelweheb GUEDDES — Groupe Décalé 2026-2027

---

## 1. Aperçu

| Acteur | Ce qu'il peut faire |
| --- | --- |
| **Visiteur** (non connecté) | Consulter les prestations, les créneaux disponibles et les témoignages. Toute action d'écriture le renvoie vers la connexion. |
| **Client** (connecté) | Réserver un créneau, consulter son historique, annuler une demande en attente, laisser un avis après une séance terminée. |
| **Administrateur / coach** | Tableau de bord (statistiques + chiffre d'affaires), validation et changement de statut des rendez-vous, CRUD des prestations, liste des comptes clients. |

### Fonctionnalités clés

- Authentification **JWT** (`Bearer <token>`) + mots de passe hachés avec **bcrypt** (sel de 10).
- Contrôle d'accès par rôle (`protect` + `adminOnly`) sur toutes les routes sensibles.
- Détection des **sessions expirées** (`TokenExpiredError`) avec message dédié.
- **Créneaux anti-double réservation** : l'API renvoie les heures déjà prises, le serveur revérifie (409 en cas de conflit).
- **Intégrité référentielle** : impossible de supprimer une prestation liée à des rendez-vous ; la suppression d'un rendez-vous supprime son avis en cascade.
- Avis **vérifiés** : un seul avis par rendez-vous, uniquement par le client propriétaire et uniquement si la séance est terminée.
- Interface responsive (CSS pur, sans framework UI).

---

## 2. Architecture

```
coach-rendez-vous/
├── server/                        # API REST — Node.js / Express (CommonJS)
│   ├── .env.example
│   ├── package.json
│   └── src/
│       ├── server.js              # point d'entrée : middlewares, routes, listen
│       ├── config/
│       │   └── db.js              # connexion asynchrone MongoDB Atlas
│       ├── models/                # 4 modèles Mongoose
│       │   ├── userModel.js
│       │   ├── serviceModel.js
│       │   ├── rendezVousModel.js
│       │   └── avisModel.js
│       ├── controllers/           # logique métier (5 contrôleurs)
│       │   ├── authController.js
│       │   ├── userController.js
│       │   ├── serviceController.js
│       │   ├── rendezVousController.js
│       │   └── avisController.js
│       ├── routes/                # déclaration des URL (5 routeurs)
│       │   ├── authRoutes.js
│       │   ├── userRoutes.js
│       │   ├── serviceRoutes.js
│       │   ├── rendezVousRoutes.js
│       │   └── avisRoutes.js
│       ├── middlewares/
│       │   ├── authMiddleware.js  # protect + adminOnly
│       │   └── errorMiddleware.js # notFound + errorHandler
│       └── seed/
│           └── seed.js            # jeu de données de démonstration
│
└── client/                        # SPA — React 19 + Vite (ESM)
    ├── .env.example
    ├── index.html
    ├── vite.config.js
    └── src/
        ├── main.jsx               # Provider Redux + montage React
        ├── App.jsx                # bascule de vues + chargements globaux
        ├── index.css / App.css    # styles
        ├── api/
        │   └── axiosClient.js     # instance Axios + intercepteur JWT
        ├── redux/                 # 5 tranches (slices)
        │   ├── store.js
        │   ├── authSlice.js
        │   ├── rendezVousSlice.js
        │   ├── serviceSlice.js
        │   ├── avisSlice.js
        │   └── uiSlice.js
        ├── components/
        │   ├── Navbar.jsx  Hero.jsx  Footer.jsx  Toast.jsx
        │   ├── AuthCard.jsx  ServiceList.jsx  BookingForm.jsx
        │   ├── RendezVousList.jsx  RendezVousCard.jsx  AvisSection.jsx
        │   └── admin/
        │       ├── AdminPanel.jsx      # onglets
        │       ├── AdminStats.jsx      # tableau de bord
        │       ├── AdminRendezVous.jsx # validation / suppression
        │       ├── AdminServices.jsx   # CRUD prestations
        │       └── AdminUsers.jsx      # comptes clients
        └── utils/
            └── format.js          # dates, prix, statuts, créneaux
```

### Séparation des responsabilités (SoC)

| Couche | Rôle | Ne fait jamais |
| --- | --- | --- |
| **Model** | Structure et validation des données | Pas de `req` / `res` |
| **Controller** | Logique métier, accès aux modèles, statuts HTTP | Pas de `app.get()` |
| **Route** | Association URL → middleware → contrôleur | Pas de logique métier |
| **Middleware** | Sécurité transversale (JWT, rôles, erreurs) | Pas d'accès direct aux collections |

---

## 3. Modèles et relations

### `User`
`name`, `email` (unique, regex), `password` (haché), `phone`, `role` (`client` | `admin`), timestamps.

### `Service`
`nom`, `description`, `duree` (15–240 min), `prix` (≥ 0), `actif` (booléen), timestamps.

### `RendezVous`
`client` → `ref: 'User'`, `service` → `ref: 'Service'`, `date` (`AAAA-MM-JJ`), `heure` (`HH:MM`),
`statut` (`en_attente` | `confirme` | `termine` | `annule`), `notes`, timestamps.
Champ virtuel `avis` (jointure 1:1) exposé par `toJSON`.

### `Avis`
`client` → `ref: 'User'`, `rendezVous` → `ref: 'RendezVous'` (**unique**), `note` (1–5), `texte`, timestamps.

### Relations One-to-Many (exigence du cahier des charges)

```
User (1) ────< RendezVous (N)          RendezVous.client
Service (1) ─< RendezVous (N)          RendezVous.service
User (1) ────< Avis (N)                Avis.client
RendezVous (1) ─── Avis (1)            Avis.rendezVous (unique)
```

Toutes exploitées côté serveur avec `.populate()` :

```js
const rendezVous = await RendezVous.find({ client: req.user._id })
  .populate('service', 'nom duree prix')
  .populate('avis')
  .sort({ date: -1, heure: -1 });
```

> **Choix technique assumé :** `date` est stockée en `String "AAAA-MM-JJ"` et `heure` en `"HH:MM"`.
> Cela évite tout décalage de fuseau horaire (le fameux `toLocaleDateString` qui décale d'un jour)
> et rend le tri lexicographique fiable : `"2026-11-15" < "2026-12-01"`.

---

## 4. API REST

Base : `http://localhost:5000/api` (ou l'URL Render en production).
Les routes marquées 🔒 exigent `Authorization: Bearer <token>`, 👑 exigent en plus `role === 'admin'`.

### Authentification — `/api/auth`

| Méthode | Route | Accès | Description |
| --- | --- | --- | --- |
| POST | `/auth/register` | public | Crée un compte client (rôle `client` forcé) → `{ user, token }` |
| POST | `/auth/login` | public | Vérifie le mot de passe avec `bcrypt.compare` → `{ user, token }` |
| GET | `/auth/profile` | 🔒 | Renvoie l'utilisateur courant (sans le mot de passe) |

### Prestations — `/api/services`

| Méthode | Route | Accès | Description |
| --- | --- | --- | --- |
| GET | `/services` | public | Liste triée par prix croissant (actives + inactives) |
| GET | `/services/:id` | public | Détail d'une prestation |
| POST | `/services` | 🔒👑 | Création |
| PUT | `/services/:id` | 🔒👑 | Mise à jour (validation Mongoose activée) |
| DELETE | `/services/:id` | 🔒👑 | Suppression — **400** si des rendez-vous y sont liés |

### Rendez-vous — `/api/rendezvous`

| Méthode | Route | Accès | Description |
| --- | --- | --- | --- |
| GET | `/rendezvous/disponibilites?date=AAAA-MM-JJ` | public | Heures déjà réservées (aucune donnée personnelle) |
| GET | `/rendezvous/mes-rendez-vous` | 🔒 | Rendez-vous du client connecté |
| GET | `/rendezvous/stats` | 🔒👑 | Compteurs + chiffre d'affaires + 5 prochains RDV |
| GET | `/rendezvous` | 🔒👑 | Tous les rendez-vous (avec client + prestation + avis) |
| GET | `/rendezvous/:id` | 🔒 | Propriétaire ou admin uniquement (**403** sinon) |
| POST | `/rendezvous` | 🔒 | Réservation — créneau futur, prestation active, pas de conflit (**409**) |
| PUT | `/rendezvous/:id` | 🔒 | Client : annulation seule. Admin : statut, date, heure, prestation |
| DELETE | `/rendezvous/:id` | 🔒 | Propriétaire ou admin — supprime l'avis lié en cascade |

### Avis — `/api/avis`

| Méthode | Route | Accès | Description |
| --- | --- | --- | --- |
| GET | `/avis` | public | Témoignages (client + prestation peuplés) |
| POST | `/avis` | 🔒 | Réservé au client du rendez-vous, statut `termine`, un seul avis (**409**) |
| DELETE | `/avis/:id` | 🔒👑 | Modération |

### Comptes — `/api/users`

| Méthode | Route | Accès | Description |
| --- | --- | --- | --- |
| GET | `/users` | 🔒👑 | Liste des comptes (sans les mots de passe) |

### Codes de statut utilisés

`200` succès · `201` création · `400` validation / règle métier · `401` token absent, invalide ou expiré ·
`403` rôle insuffisant ou ressource d'autrui · `404` ressource inexistante · `409` doublon ou créneau pris · `500` erreur serveur.

---

## 5. Installation locale

### Prérequis
Node.js ≥ 18, un cluster **MongoDB Atlas** (ou un MongoDB local).

### 5.1 Backend

```bash
cd server
npm install
```

Copiez `.env.example` en `.env` puis renseignez :

```env
PORT=5000
MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/coachDB?retryWrites=true&w=majority
JWT_SECRET=une_cle_longue_et_difficile_a_deviner
CLIENT_URL=http://localhost:5173
```

Initialisez la base de démonstration, puis lancez l'API :

```bash
npm run seed     # ATTENTION : vide les collections avant de les remplir
npm run dev      # http://localhost:5000  (node --watch)
```

Vérification rapide : ouvrir `http://localhost:5000/` doit renvoyer le message d'accueil de l'API.

### 5.2 Frontend

```bash
cd client
npm install
```

Copiez `.env.example` en `.env` :

```env
VITE_API_URL=http://localhost:5000/api
```

```bash
npm run dev      # http://localhost:5173
```

### 5.3 Comptes de démonstration (créés par le seed)

| Rôle | Email | Mot de passe |
| --- | --- | --- |
| Administrateur / coach | `admin@elan.tn` | `admin123` |
| Client | `client@elan.tn` | `client123` |
| Client | `sami@elan.tn` | `client123` |

> Les boutons « Compte démo client » et « Compte démo admin » du formulaire de connexion
> pré-remplissent ces identifiants : pratique pour la soutenance.

---

## 6. Choix techniques et points d'oral

| Sujet | Ce qu'il faut savoir expliquer |
| --- | --- |
| **CommonJS vs ESM** | Le backend utilise `require` / `module.exports` (convention du cours) ; le frontend utilise `import` / `export` car Vite compile en modules ES. |
| **bcrypt** | `genSalt(10)` puis `hash`. On ne stocke jamais le mot de passe en clair. `compare` recalcule le hash avec le sel contenu dans la chaîne stockée : comparaison en temps constant. |
| **JWT** | `jwt.sign({ id, role }, SECRET, { expiresIn: '1d' })`. Le token est **signé**, pas chiffré : on n'y met jamais de données sensibles. |
| **`protect`** | Lit l'en-tête `Authorization`, vérifie la signature, recharge l'utilisateur depuis la base (`.select('-password')`) : un compte supprimé perd immédiatement ses droits, même avec un token valide. |
| **`adminOnly`** | RBAC simple : `req.user.role === 'admin'`. Doit toujours être placé **après** `protect`. |
| **Intercepteur Axios** | Une seule instance `axiosClient` ; l'intercepteur ajoute `Bearer` à chaque requête depuis `localStorage`. Zéro duplication dans les composants. |
| **Redux Toolkit** | Un *slice* par domaine. `createSlice` génère les *action creators*. On ne mute jamais l'état à la main : Immer s'en charge. |
| **Pourquoi pas `createAsyncThunk` ?** | Le cours (S5/S6) place les appels Axios dans les composants puis `dispatch(...)`. Choix assumé pour rester lisible et conforme. |
| **Pourquoi pas React Router ?** | Une seule page à trois vues (`accueil`, `mes-rdv`, `admin`) gérées par un état local : cela évite d'ajouter une dépendance et le `vercel.json` de réécriture. |
| **Ordre des routes** | `/disponibilites`, `/mes-rendez-vous`, `/stats` sont déclarées **avant** `/:id`, sinon Express interprète `stats` comme un identifiant. |
| **Sécurité côté serveur** | Le `client` d'un rendez-vous vient **du token** (`req.user._id`), jamais du `req.body` : impossible de réserver au nom d'autrui. |
| **`runValidators: true`** | Sur `findByIdAndUpdate`, les validateurs Mongoose ne s'exécutent pas par défaut. On les active explicitement. |
| **Index** | `email` est `unique`, `Avis.rendezVous` est `unique`, et `{ date, heure }` est indexé pour accélérer la détection de conflits. |

---

## 7. Déploiement

### 7.1 MongoDB Atlas
1. Créer un cluster gratuit (M0).
2. *Database Access* → utilisateur avec mot de passe.
3. *Network Access* → `0.0.0.0/0` (nécessaire pour Render).
4. Copier la chaîne de connexion dans `MONGODB_URI` (base `coachDB`).

### 7.2 Backend sur Render
1. *New → Web Service* → dépôt GitHub.
2. **Root Directory** : `server`
3. **Build Command** : `npm install`
4. **Start Command** : `npm start`
5. Variables d'environnement : `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL` (= URL Vercel), `PORT` (Render l'injecte).
6. Après le premier déploiement, lancer le seed depuis un shell Render : `npm run seed`.

### 7.3 Frontend sur Vercel
1. *Add New → Project* → même dépôt.
2. **Root Directory** : `client` — Framework : **Vite**.
3. Build : `npm run build` — Output : `dist`.
4. Variable : `VITE_API_URL = https://<service>.onrender.com/api`.
5. Redéployer après avoir mis à jour `CLIENT_URL` côté Render (CORS).

### 7.4 Vérifications post-déploiement
- `GET https://<service>.onrender.com/` → message JSON de l'API.
- Connexion avec le compte admin → le tableau de bord s'affiche.
- Une réservation depuis Vercel apparaît côté admin (donc CORS + JWT + Atlas OK).

---

## 8. Conformité au cahier des charges

| Exigence | Où c'est satisfait |
| --- | --- |
| ≥ 3 modèles Mongoose | **4** : `User`, `Service`, `RendezVous`, `Avis` |
| Relation One-to-Many avec `ref` + `.populate()` | `User → RendezVous`, `Service → RendezVous`, `User → Avis`, `RendezVous → Avis` |
| `POST /api/auth/register` et `/api/auth/login` | `authRoutes.js` |
| Hachage bcrypt | `authController.js` |
| Middleware `protect` sur POST / DELETE | `rendezVousRoutes.js`, `serviceRoutes.js`, `avisRoutes.js` |
| SPA React (Vite) | `client/` |
| ≥ 80 % des techniques du cours | Voir §6 (JWT, bcrypt, Mongoose, populate, Redux Toolkit, Axios interceptor, `useEffect` + cleanup, validation, try/catch, `.env`) |
| Visiteur lecture seule / actions réservées aux connectés | `ServiceList` / `AuthCard` / `BookingForm` |
| Panneau d'administration | `components/admin/*` |
| Atlas + Render + Vercel | §7 |
| `.gitignore` strict (pas de `.env`) | `.gitignore` racine + `server/` + `client/` |
| README | ce fichier |

---

## 9. Scénario de démonstration (5 minutes)

1. **Visiteur** : la page d'accueil affiche les prestations et les témoignages ; cliquer sur
   « Réserver cette séance » renvoie vers le formulaire de connexion.
2. **Connexion client** (`client@elan.tn`) : réserver une séance → toast de confirmation,
   le rendez-vous apparaît dans « Mes rendez-vous » avec le statut *En attente*.
3. **Connexion admin** (`admin@elan.tn`) : onglet *Tableau de bord* (compteurs, CA, prochains RDV),
   onglet *Rendez-vous* → **Confirmer** puis **Terminer** la demande.
4. **Retour client** : le rendez-vous est *Terminé* → « Laisser un avis » → 5 étoiles → l'avis
   apparaît immédiatement dans la section *Témoignages* de l'accueil.
5. **Admin** : onglet *Prestations* → créer une prestation, la désactiver ; tenter de supprimer une
   prestation liée à un rendez-vous → message d'erreur 400 (intégrité référentielle).
6. **Sécurité** : se déconnecter, appeler une route protégée sans token (401) ; se connecter en client
   et appeler `/api/rendezvous` (403).

---

## 10. Dépannage

| Symptôme | Cause probable | Solution |
| --- | --- | --- |
| `Erreur critique de demarrage : L'URI MongoDB est manquant` | `.env` absent ou mal placé | Le fichier doit être `server/.env` |
| `MongooseServerSelectionError` | IP non autorisée sur Atlas | *Network Access* → `0.0.0.0/0` |
| `Non autorise, token invalide` après redémarrage | `JWT_SECRET` a changé | Se reconnecter (ou figer le secret) |
| Requêtes bloquées par CORS en production | `CLIENT_URL` ne correspond pas à l'URL Vercel | Mettre l'URL exacte, sans slash final |
| `404` sur `/api/rendezvous/stats` | Route déclarée après `/:id` | Respecter l'ordre des routes |
| Les créneaux ne se rafraîchissent pas | La date n'a pas changé | Choisir une autre date puis revenir |
