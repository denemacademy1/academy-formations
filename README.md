# DENEM Academy — Fiches de formation

Site statique GitHub Pages hébergeant les fiches de cours du programme DENEM Academy : 27 séances en 4 actes pour former des freelances Experts IA en 90 jours.

URL prod : https://denemacademy1.github.io/academy-formations/

---

## Philosophie

**Chaque séance = sa propre page bespoke.** Pas de template générique : chaque page séance est conçue à la main avec ses cartes interactives, ses animations et ses composants riches, pensée pour être présentée en vidéo (screen recording).

L'index liste les 27 séances avec une barre de progression sauvegardée en `localStorage`.

---

## Structure

```
.
├── index.html                       # accueil + 27 cartes séance + progression
├── assets/
│   ├── styles.css                   # design system commun (header, accueil, footer)
│   ├── script.js                    # progression localStorage + checkboxes index
│   ├── seance.css                   # composants bespoke des pages séance
│   └── seance.js                    # interactivité bespoke (accordion, tabs, counters, etc.)
├── seances/
│   └── acte-0-seance-1.html         # une page bespoke par séance disponible
└── README.md
```

- HTML/CSS/JS pur. Pas de build, pas de framework.
- Polices : **Manrope** (titres séance, plus lisible) · **DM Sans** (corps) · **Syne** (logo brand).

---

## Composants interactifs disponibles (à réutiliser pour les futures séances)

Vois `seances/acte-0-seance-1.html` comme la référence canonique. Tous les composants ci-dessous sont stylés dans `assets/seance.css` et hydratés par `assets/seance.js`.

| Composant | Classe principale | Utilité |
|-----------|-------------------|---------|
| Hero animé avec orbs flottants + titre dégradé | `.seance-hero-v2` + `.hero-title` | Ouverture impactante |
| Scroll progress bar (top) | `.scroll-progress` | Indique la progression dans la lecture |
| Callout "À retenir" premium | `.callout-retenir-v2` | Synthèse en haut de fiche |
| Cartes "Croyances / concepts" | `.croyance-card` | 2 à 4 cartes en grille, magnetic hover |
| Compteur animé au scroll | `[data-counter data-from data-to data-suffix]` | Stats qui s'animent (€, %, etc.) |
| Comparaison "VS" | `.vs-wrap` + `.vs-row` | Avant/après, problème/solution |
| Accordion expandable | `.raison-card` | Liste de points à dévoiler au clic |
| Tabs (panels) | `.tabs-wrap` + `.tabs-nav` + `.tab-panel` | Comparaison de 2 ou 3 facettes |
| Listes check / cross | `.check-list` / `.cross-list` | Engagements, exclusions |
| Quote forte | `.quote-strong` | Punchline avec dégradé |
| Cards profils/tiers | `.profil-card` | Tableaux de profils en cartes |
| Steps interactifs (exercice) | `.exercice-wrap` + `.step-card` | Exercice à étapes avec auto-highlight au scroll |
| Checklist actions sauvegardée | `.action-item` | Auto-mark séance vue + confetti |
| Floating action bar (bottom) | `.floating-actions` | "Marquer comme vu" + retour haut |
| Texte avec dégradé animé | `<span class="grad">…</span>` ou `.grad-orange` | Surlignage de mots clés |
| Reveal stagger au scroll | `[data-reveal data-reveal-delay="120"]` | Apparition progressive |

---

## Ajouter une nouvelle séance

1. **Dupliquer la page de référence** :
   ```bash
   cp seances/acte-0-seance-1.html seances/acte-0-seance-2.html
   ```

2. **Mettre à jour les éléments globaux** :
   - `<title>` et `<meta name="description">`
   - `<body data-seance-id="acte-X-seance-Y">` (utilisé par localStorage)
   - Le breadcrumb (`Séance Y`)
   - Le badge `.hero-acte-tag` (si autre acte, adapter le texte)
   - `<h1 class="hero-title">` titre de la séance + `.hero-accroche` accroche
   - `.hero-meta-row` : durée, animateur, format
   - Le `<div class="video-wrap-v2">` : remplacer le placeholder par `<iframe src="URL_TELLA" ...></iframe>`
   - Le `.callout-retenir-v2` : la synthèse en 3-4 lignes

3. **Adapter les sections au contenu de la séance**.
   Tu peux librement piocher dans les composants ci-dessus, en supprimer, en ajouter. Le but : rester visuellement riche pour le screen recording.

4. **Mettre à jour la nav bas** (`.seance-nav`) avec les vraies séances précédente/suivante.

5. **Activer la carte sur l'index** (`index.html`) :
   - Trouver la div `data-seance-id="acte-X-seance-Y"` correspondante
   - La transformer de `<div data-status="soon">` en `<a href="seances/..." data-status="available">` avec `class="seance-card"`
   - Changer `<span class="card-status" data-status="soon">À venir</span>` en `data-status="available">Disponible`
   - Ajouter le `<div class="card-foot">` avec checkbox + CTA "Ouvrir →" (voir séance 1 comme modèle)

---

## Convention des IDs (`data-seance-id`)

- `acte-0-seance-1` ... `acte-0-seance-3`
- `acte-1-seance-1` ... `acte-1-seance-4`
- `acte-2-seance-1` ... `acte-2-seance-12`
- `acte-3-seance-1` ... `acte-3-seance-8`

Ces IDs sont la clé de tout : progression localStorage, checklist actions, mark-as-seen.

---

## Identité visuelle

| Token            | Valeur            |
|------------------|-------------------|
| Fond principal   | `#0D0C14`         |
| Fond cartes      | `#13111F`         |
| Accent primaire  | `#6B5BFF` (violet)|
| Accent secondaire| `#C8FF57` (lime)  |
| Accent orange    | `#FF9D5C`         |
| Texte principal  | `#FFFFFF`         |
| Polices          | Manrope (titres séance) · DM Sans (corps) · Syne (logo) |

---

## Déploiement

Push sur `main` → GitHub Pages déploie automatiquement.

Settings → Pages : *Deploy from branch* → `main` / `/` (root).

URL : https://denemacademy1.github.io/academy-formations/

---

## Test local

```bash
python3 -m http.server 8000
# puis http://localhost:8000
```
