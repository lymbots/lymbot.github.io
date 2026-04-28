# Indholdsguide: sådan fyldes sitet op

Denne version indeholder alle 17 programmer for Socialdemokratiet, Venstre og Det Konservative Folkeparti.

## Hvad er gjort klar

Alle programmer er registreret i:

`docs/data/programs.json`

Alle fuldtekster er lagt som tekstfiler i:

`docs/data/full_texts/`

Fuldteksterne bruges som råmateriale. Emneopdelingen skal stadig kurateres manuelt i `programs.json`.

## Sådan tilføjer du et emne/uddrag til et program

Find programmet i `docs/data/programs.json`, fx:

```json
{
  "id": "S_1977",
  "partyId": "S",
  "year": 1977,
  "title": "Solidaritet Lighed og Trivsel",
  "topics": []
}
```

Tilføj et emne i `topics`:

```json
"topics": [
  {
    "topicId": "velfaerd",
    "excerpts": [
      {
        "id": "S_1977_velfaerd_1",
        "text": "Indsæt originalt uddrag fra programmet her."
      }
    ]
  }
]
```

## Vigtige regler

- `topicId` skal matche et emne i listen øverst i `programs.json`.
- `id` for hvert uddrag bør være unikt.
- `text` skal være partiets egen tekst, ikke en analyse.
- Brug fuldteksterne i `docs/data/full_texts/` som arbejdsgrundlag.

## Hvis du vil tilføje et nyt parti senere

1. Tilføj partiet i `parties`.
2. Tilføj partiets programmer i `programs`.
3. Læg fuldtekstfiler i `docs/data/full_texts/`.
4. Tilføj emneuddrag under hvert program.

Frontend bør kunne håndtere nye partier uden ændringer i koden.
