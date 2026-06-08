# Analysepipeline for emner

Denne mappe bruges til emneklassifikation og eksplorativ tekstmining af
principprogrammer og regeringsgrundlag.

## Hvad pipelinen gør

`build_topic_pipeline.py` læser:

- `docs/data/programs.json`
- `docs/data/full_texts/*.txt`

og genererer:

- `analysis/output/chunks.json`
- `analysis/output/chunks.csv`
- `analysis/output/topic_clusters.json`
- `analysis/output/topic_report.md`

Pipelineidéen for partiprogrammerne er:

1. Hvert program opdeles i mindre tekststykker (`chunks`).
2. Hvert chunk får metadata med parti, år, program og løbenummer.
3. Chunks vektoriseres med TF-IDF.
4. Chunks grupperes i eksplorative klynger med `KMeans`.
5. Klyngerne bruges som teknisk kontrol af den redaktionelle 16-emne-taksonomi.
6. Hvert chunk klassificeres derefter med forklarlige nøgleord og tærskler fra taksonomien.

Klyngerne er ikke endelige emner. Sitet viser den stabile, redaktionelle
realpolitiske taksonomi og de primære emneforslag, der kan forklares med konkrete
nøgleord.

## Metodisk afgrænsning

- Emnefordelinger er tekststykke-baserede. En procentvis fordeling betyder derfor
  andelen af klassificerede tekststykker i et valgt udsnit, ikke en måling af
  politisk betydning, kausal indflydelse eller vælgerprioritet.
- Regeringsgrundlagenes indikator for partinærhed bruger TF-IDF/cosinus mellem
  regeringsgrundlagets emnetekst og de aktuelle principprogrammers emnetekst for
  partier i regering/parlamentarisk grundlag.
- Den viste procent for partinærhed er normaliseret inden for ét regeringsgrundlag
  og ét emne. Den kan bruges til at rangordne tekstlig nærhed i det konkrete
  udsnit, men ikke som dokumentation for politisk indflydelse.
- OCR-støj og historisk sprogbrug kan påvirke både chunking og emneklassifikation.
  Derfor vises de fulde kilder altid ved siden af analyseuddragene.

## Metodiske henvisninger

- Grimmer, J. & Stewart, B. M. (2013). *Text as Data: The Promise and Pitfalls of
  Automatic Content Analysis Methods for Political Texts*. Political Analysis.
  https://doi.org/10.1093/pan/mps028
- TF-IDF i scikit-learn:
  https://scikit-learn.org/stable/modules/generated/sklearn.feature_extraction.text.TfidfVectorizer.html
- Cosinus-similaritet i scikit-learn:
  https://scikit-learn.org/stable/modules/generated/sklearn.metrics.pairwise.cosine_similarity.html
- KMeans i scikit-learn:
  https://scikit-learn.org/stable/modules/generated/sklearn.cluster.KMeans.html

## Kør analysen

Fra projektroden:

```bash
python3 analysis/build_topic_pipeline.py
```

Du kan justere antallet af eksplorative klynger:

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

1. Gennemgå klynge-rapporten for uventede mønstre og OCR-problemer
2. Justér den realpolitiske taksonomis nøgleord, hvis et emne systematisk rammer forkert
3. Genkør partiprogram- og regeringsgrundlagspipelines
4. Spotcheck udvalgte partier, emner og regeringsgrundlag i browseren

## Kendte begrænsninger

- OCR-støj påvirker klyngerne
- Organisationsafsnit og vedtægtslignende tekst kan danne egne klynger
- Små partier med få programmer kan blive overrepræsenteret af ét dokument
- Klynge-id'er er ikke stabile på tværs af ændringer i datagrundlaget
