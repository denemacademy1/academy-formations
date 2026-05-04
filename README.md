# DENEM Academy — Fiches de formation

Site statique hébergeant les fiches de cours du programme DENEM Academy : 27 séances réparties en 4 actes pour former des freelances Experts IA en 90 jours.

URL de production (GitHub Pages) : `https://denemacademy1.github.io/academy-formations/`

---

## Structure

```
.
├── index.html                       # page d'accueil + liste des 27 séances
├── assets/
│   ├── styles.css                   # design system commun
│   └── script.js                    # progression localStorage, TOC, rendu markdown
├── seances/
│   └── acte-0-seance-1.html         # une page par séance disponible
└── README.md
```

- HTML/CSS/JS pur — pas de build, pas de framework.
- Le contenu de chaque séance est embarqué en markdown dans une balise `<script type="text/markdown">` et rendu côté client avec [marked.js](https://github.com/markedjs/marked).
- La progression de l'apprenant est stockée localement (`localStorage`, clé `denem-progress`).

---

## Déploiement (GitHub Pages)

1. Pousser sur la branche `main`.
2. Dans Settings → Pages : sélectionner *Deploy from branch* → `main` / `/` (root).
3. Le site est servi sur `https://denemacademy1.github.io/academy-formations/`.

---

## Ajouter une nouvelle séance

1. **Dupliquer le template** :
   ```bash
   cp seances/acte-0-seance-1.html seances/acte-0-seance-2.html
   ```

2. **Mettre à jour les éléments suivants dans le nouveau fichier** :
   - `<title>` et `<meta name="description">`
   - `<body data-seance-id="acte-X-seance-Y">`
   - Le breadcrumb (`Séance 2`)
   - Le badge `<span class="seance-acte-tag">` (si autre acte)
   - Le `<h1>` titre + `<p class="seance-accroche">` accroche
   - Les métadonnées (durée, animateur, format)
   - Le lien vidéo (`href` du `#video-cta` + l'`<iframe>` du `.video-wrap`)
   - Le bloc `<script type="text/markdown" id="seance-markdown">` : coller le markdown de la fiche
   - La navigation bas de page (`.seance-nav`)

3. **Activer la carte sur l'index** :
   Dans `index.html`, remplacer la div `data-status="soon"` correspondante par un `<a>` cliquable :
   ```html
   <a href="seances/acte-0-seance-2.html" class="seance-card" data-status="available" ...>
     ...
     <span class="card-status" data-status="available">Disponible</span>
     ...
   </a>
   ```

   Pense à ajouter la `<label class="card-checkbox">` et le `<span class="card-cta">` comme sur la séance 1.

---

## Conventions du markdown des fiches

Le rendu reconnaît automatiquement deux blocs spéciaux :

- **Encadré "À retenir"** : commence par `## À retenir ...` (sera enveloppé dans un cadre violet)
- **Encadré "Exercice"** : commence par `## Exercice ...` (sera enveloppé dans un cadre orange)

Tout le reste suit le markdown standard : `#`, `##`, `###`, listes, tableaux, citations `>`, gras `**`, italique `*`.

---

## Identité visuelle

| Token            | Valeur            |
|------------------|-------------------|
| Fond principal   | `#0D0C14`         |
| Fond cartes      | `#13111F`         |
| Accent primaire  | `#6B5BFF` (violet)|
| Accent secondaire| `#C8FF57` (lime)  |
| Texte principal  | `#FFFFFF`         |
| Polices          | Syne 700/800 (titres) · DM Sans 300/400/500/700 (corps) |

---

## Local

Pas de build. Pour tester en local :

```bash
python3 -m http.server 8000
# puis http://localhost:8000
```
