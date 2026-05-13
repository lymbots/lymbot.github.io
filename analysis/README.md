# Analysepipeline for emner

Denne mappe bruges til eksplorativ emneanalyse af principprogrammerne.

## Hvad pipelinen gør

`build_topic_pipeline.py` læser:

- `docs/data/programs.json`
- `docs/data/full_texts/*.txt`

og genererer:

- `analysis/output/chunks.json`
- `analysis/output/chunks.csv`
- `analysis/output/topic_clusters.json`
- `analysis/output/topic_report.md`

Pipelineidéen er:

1. Hvert program opdeles i mindre tekststykker (`chunks`).
2. Hvert chunk får metadata med parti, år, program og løbenummer.
3. Chunks vektoriseres med TF-IDF.
4. Chunks grupperes i eksplorative klynger med `KMeans`.
5. Der laves en rapport med topord og repræsentative tekstuddrag.

Klyngerne er ikke endelige emner. De er et arbejdsredskab til at definere en mere stabil, redaktionel emneliste.

## Kør analysen

Fra projektroden:

```bash
python3 analysis/build_topic_pipeline.py
```

Du kan justere antallet af klynger:

```bash
python3 analysis/build_topic_pipeline.py --clusters 14
```

Du kan også justere chunk-størrelsen:

```bash
python3 analysis/build_topic_pipeline.py --min-words 100 --target-words 180 --max-words 280
```

## Sådan bruger du outputtet

- Start i `analysis/output/topic_report.md`
- Brug topord og eksempeluddrag til at navngive foreløbige emner
- Gå derefter til `analysis/output/chunks.csv` eller `analysis/output/chunks.json`
- Tag relevante chunks manuelt eller halvautomatisk med dine endelige emner

## Praktisk anbefaling

Den bedste næste fase er typisk:

1. Navngiv 8-15 stabile hovedemner ud fra rapporten
2. Lav en separat tagging-fil for chunks
3. Vælg de bedste uddrag pr. emne og program
4. Før først derefter de kuraterede emner tilbage ind i `docs/data/programs.json`

## Kendte begrænsninger

- OCR-støj påvirker klyngerne
- Organisationsafsnit og vedtægtslignende tekst kan danne egne klynger
- Små partier med få programmer kan blive overrepræsenteret af ét dokument
- Klynge-id'er er ikke stabile på tværs af ændringer i datagrundlaget
