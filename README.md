# Smart Industrial Asset Intelligence & Spare Parts Innovation

Plateforme de maintenance industrielle développée lors d'un hackathon de 48h.
Elle couvre le cycle complet : signalement de panne, workflow d'intervention, gestion des pièces de rechange et analytics prédictifs.

---

## Architecture

```
├── server/                  API REST Node.js/Express + SQLite
│   ├── routes/api.js        Tous les endpoints métier
│   ├── routes/auth.js       Authentification JWT
│   └── db/
│       ├── database.js      Schéma SQLite (7 tables)
│       └── seed.js          Données de démonstration
│
├── app-technicien/          PWA mobile (port 5173)
│   └── src/mobile/
│       ├── screens/         5 écrans : Dashboard, Signalement, Intervention, Scan, Fiche équipement
│       ├── components/      AppBar, BottomNav, Cards réutilisables
│       └── lib/             Utilitaires, métadonnées de sévérité
│
└── web-manager-admin/       Dashboard web manager/admin (port 5174)
    └── src/web/WebApp.jsx   6 modules : Dashboard, Équipements, Pannes, Pièces, Analytics, Équipe
```

### Modèle de données (SQLite)

| Table | Rôle |
|---|---|
| `users` | Techniciens, managers, admins — JWT auth |
| `equipements` | Parc machine avec criticité, QR code, statut |
| `pannes` | Signalements liés à un équipement et un technicien |
| `photos` | Photos multi-angles rattachées à une panne |
| `workflow_etapes` | Étapes d'intervention assignées, avec deadline |
| `demandes_pieces` | Requêtes de pièces de rechange avec niveau d'urgence |
| `diagnostics_ia` | Résultats JSON des diagnostics Claude AI |

---

## Fonctionnalités

### App technicien (mobile PWA)
- **Dashboard** : résumé des pannes assignées, alerte critique, vue parc
- **Signalement vocal** : reconnaissance vocale via l'API SpeechRecognition du navigateur (Chrome/Edge)
- **Formulaire de panne** : sélection équipement, sévérité (mineur / modéré / urgent / critique), description, capture photo guidée 4 angles, pièces suggérées
- **Écran d'intervention** : progression en % des étapes, onglets Étapes / Pièces / Diagnostic IA / Photos, validation étape par étape
- **Scan QR code** : identification instantanée d'un équipement via caméra (`html5-qrcode`) + fallback liste manuelle
- **Fiche équipement** : specs, QR code téléchargeable, historique des pannes
- **Mode hors-ligne** : les rapports créés sans connexion sont mis en file d'attente (IndexedDB) et synchronisés automatiquement au retour en ligne

### Dashboard manager/admin (web)
- **Vue globale** : 4 KPIs temps réel, flux d'incidents critiques, état du parc, pièces en attente
- **Équipements** : registre complet, ajout d'actifs, téléchargement QR, historique des pannes par machine
- **Ordres de travail** : liste filtrée par statut, panneau de détail avec changement de statut, gestion du workflow (ajout d'étapes, assignation, validation), approbation/rejet des pièces, déclenchement du diagnostic IA, galerie photos
- **Pièces de rechange** : approbation/rejet avec badge d'urgence
- **Analytics** : 4 graphiques (pannes par équipement, pièces les plus demandées, tendances temporelles, score de risque), export JSON horodaté
- **Équipe** : liste des membres, modification du rôle, création de compte

### Diagnostic IA
Quand déclenché sur une panne, le serveur envoie la description, la sévérité, le modèle machine et les photos à **Claude claude-3-5-sonnet-latest** (Anthropic). Il retourne un JSON avec :
- `type_defaut_probable`
- `cause_possible`
- `pieces_suggerees`

Si `ANTHROPIC_API_KEY` n'est pas renseignée, un résultat local de démonstration est renvoyé — l'application fonctionne sans clé API.

---

## Démarrage

### 1. Prérequis
- Node.js 18+
- npm

### 2. Installation
```bash
npm run install:all
```

### 3. Configuration (optionnel)
```bash
cp .env.example .env
# Éditer .env et renseigner ANTHROPIC_API_KEY pour activer le vrai diagnostic IA
```

### 4. Initialiser la base de données avec des données de démo
```bash
npm run seed
```

### 5. Lancer les trois services
```bash
npm run dev
```

| Service | URL | Rôle |
|---|---|---|
| API REST | http://localhost:3001 | Backend Node.js/Express |
| App Technicien | http://localhost:5173 | PWA mobile |
| Dashboard Manager | http://localhost:5174 | Interface web admin |

---

## Comptes de démonstration

Mot de passe commun : **`demo1234`**

| Email | Rôle | Application |
|---|---|---|
| `tech@demo.local` | Technicien | App mobile (port 5173) |
| `manager@demo.local` | Manager | Dashboard admin (port 5174) |
| `admin@demo.local` | Admin | Dashboard admin (port 5174) |

---

## Stack technique

| Couche | Technologies |
|---|---|
| Backend | Node.js, Express, better-sqlite3, JWT (jsonwebtoken), bcryptjs |
| Frontend mobile | React 18, Vite, Tailwind CSS (CDN), Material Symbols |
| Frontend web | React 18, Vite, Tailwind CSS (CDN), recharts |
| PWA | Web App Manifest, Service Worker, IndexedDB (offline queue) |
| QR Code | `qrcode` (génération serveur), `html5-qrcode` (scan caméra) |
| IA | Anthropic SDK — claude-3-5-sonnet-latest avec fallback local |
| Voix | Web Speech API (SpeechRecognition) — natif navigateur |

---

## Scripts disponibles (racine)

```bash
npm run dev              # Lance les 3 services en parallèle (concurrently)
npm run dev:server       # Serveur API seul
npm run dev:technicien   # App mobile seule
npm run dev:web          # Dashboard admin seul
npm run seed             # Réinitialise et remplit la base de données
npm run install:all      # Installe les dépendances des 3 packages
```

---

## Endpoints API principaux

```
POST   /api/auth/login
GET    /api/equipements
POST   /api/equipements
GET    /api/equipements/:id/qrcode        → PNG du QR code
GET    /api/pannes
POST   /api/pannes
PUT    /api/pannes/:id/statut
POST   /api/pannes/:id/photos             → upload multipart
POST   /api/pannes/:id/etapes
PUT    /api/etapes/:id/statut
POST   /api/pannes/:id/pieces
PUT    /api/pieces/:id/statut
POST   /api/pannes/:id/diagnostic         → appel Claude AI
GET    /api/analytics/pannes-par-equipement
GET    /api/analytics/pieces-frequentes
GET    /api/analytics/tendances
GET    /api/analytics/risques
GET    /api/export                        → export JSON complet
```

Tous les endpoints (sauf `/auth/login`) requièrent un header `Authorization: Bearer <token>`.
