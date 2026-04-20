# De politiske principper: byg og gå live

Denne guide viser, hvordan du bygger videre på prototypen og gør siden offentlig med GitHub Pages.

## 1) Hvad er bygget nu

Webappen ligger i `docs/`, så den kan deployes direkte med GitHub Pages.

- `docs/index.html`: struktur og UI
- `docs/styles.css`: visuelt design
- `docs/app.js`: filtrering og visningslogik
- `docs/data/programs.json`: manuel datamodel med emner, partier, programmer og uddrag

## 2) Sådan opdaterer du indholdet

Du skal primært redigere `docs/data/programs.json`:

- Tilføj flere programmer under `programs`
- Tilføj rigtige tekstuddrag under `topics[].excerpts[]`
- Tilføj konteksttekst i feltet `context`
- Tilføj officielle links i `externalUrl` når de findes

## 3) Lokal test på din computer

Åbn terminal i projektmappen og kør:

```bash
python3 -m http.server 8000
```

Åbn derefter:

- http://localhost:8000/docs/

## 4) Gør siden live via GitHub (anbefalet)

1. Opret et nyt repository på GitHub (fx `de-politiske-principper`).
2. Upload hele projektmappen.
3. Gå til repository -> Settings -> Pages.
4. Under "Build and deployment":
   - Source: "Deploy from a branch"
   - Branch: `main`
   - Folder: `/docs`
5. Gem. Efter ca. 1-3 minutter får du en offentlig URL, fx:
   - `https://DIT-BRUGERNAVN.github.io/de-politiske-principper/`

Alle kan derefter besøge siden direkte.

## 5) Kan det gøres via Substack?

Ja, men bedst som distribution, ikke hosting.

Substack er stærk til nyhedsbrev og trafik, mens selve webappen hostes bedst på GitHub Pages.

Praktisk opsætning:

1. Sæt webappen live på GitHub Pages.
2. Opret en side eller et fast opslag i Substack med intro og link til appen.
3. Brug evt. en tydelig CTA-knap: "Åbn De politiske principper".
4. Del nye opdateringer af datagrundlaget via nyhedsbreve.

## 6) Domæne (valgfrit)

Hvis du vil have et eget domæne (fx `depolitiskeprincipper.dk`):

1. Køb domænet hos en registrar.
2. Knyt domænet til GitHub Pages i Settings -> Pages -> Custom domain.
3. Opdater DNS efter GitHubs vejledning.

Så vil både Substack og andre kunne linke til dit eget domæne.

## 7) Forslag til næste byggefase

- Importér alle programmer fra `manual_edit/` ind i `docs/data/programs.json`
- Erstat pladsholdere med rigtige, manuelle citatuddrag
- Tilføj 6-10 faste emner i første version
- Tilføj en enkel "Om kilderne"-side
- Tilføj kildehenvisning til sidetal/afsnit pr. uddrag
