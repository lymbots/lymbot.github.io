# Første emneforslag pr. chunk

Denne fil bygger oven på klyngeanalysen og giver et første emneforslag til hvert chunk.
Forslagene er arbejdsforslag og skal gennemgås redaktionelt.

## Emnefordeling

- Ideologi og systemkritik: 100
- Demokrati og retsstat: 63
- Stat, marked og økonomi: 258
- Velfærd og socialpolitik: 51
- Arbejde og fagbevægelse: 53
- Uddannelse og dannelse: 84
- Internationalt samarbejde og Europa: 180
- Klima, miljø og energi: 78
- Familie, kultur og værdier: 85
- Nation, udlændinge og identitet: 36
- Forsvar og sikkerhed: 36
- Parti og organisation: 40

## Arbejdsgang

1. Start i `analysis/output/topic_suggestions.csv`.
2. Sortér på `primary_topic_label` eller `program_id`.
3. Ret `primary_topic_id` og `secondary_topic_id`, hvor forslaget er forkert.
4. Skift `review_status` til `approved`, når et chunk er gennemgået.
