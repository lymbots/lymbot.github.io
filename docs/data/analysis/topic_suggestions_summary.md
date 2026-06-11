# Emneforslag

Denne fil opsummerer de analysebaserede emneforslag, der bruges på sitet.

## Datagrundlag

- Partiprogram-tekststykker med emneforslag: 1756
- Regeringsgrundlag-tekststykker med emneforslag: 888
- Samlet antal tekststykker med emneforslag: 2644
- Emner i taksonomien: 18

## Emnefordeling

- Økonomi, skat og finanspolitik: 148 (partiprogrammer 88, regeringsgrundlag 60)
- Erhverv, arbejdsmarked og beskæftigelse: 361 (partiprogrammer 225, regeringsgrundlag 136)
- Offentlig sektor, velfærd og forvaltning: 117 (partiprogrammer 64, regeringsgrundlag 53)
- Sundhed og psykiatri: 98 (partiprogrammer 55, regeringsgrundlag 43)
- Ældre, pension og omsorg: 64 (partiprogrammer 44, regeringsgrundlag 20)
- Børn, familie og socialpolitik: 190 (partiprogrammer 97, regeringsgrundlag 93)
- Skole, uddannelse og forskning: 211 (partiprogrammer 132, regeringsgrundlag 79)
- Klima, miljø og energi: 140 (partiprogrammer 60, regeringsgrundlag 80)
- Landbrug, fødevarer og dyrevelfærd: 71 (partiprogrammer 59, regeringsgrundlag 12)
- Udlændinge, integration og statsborgerskab: 95 (partiprogrammer 61, regeringsgrundlag 34)
- Retspolitik, politi og kriminalitet: 105 (partiprogrammer 65, regeringsgrundlag 40)
- Forsvar, sikkerhed og beredskab: 79 (partiprogrammer 46, regeringsgrundlag 33)
- EU, udenrigspolitik og internationalt samarbejde: 351 (partiprogrammer 246, regeringsgrundlag 105)
- Demokrati, retsstat og forfatning: 92 (partiprogrammer 83, regeringsgrundlag 9)
- Bolig, transport, by og landdistrikter: 112 (partiprogrammer 74, regeringsgrundlag 38)
- Kultur, religion, medier og værdier: 147 (partiprogrammer 119, regeringsgrundlag 28)
- Ligestilling, minoriteter og rettigheder: 76 (partiprogrammer 65, regeringsgrundlag 11)
- Ideologi, parti og samfundssyn: 187 (partiprogrammer 173, regeringsgrundlag 14)

## Metode

Partiprogrammer og regeringsgrundlag er genkørt med automatisk tekstopdeling, TF-IDF/KMeans-klyngekontrol og en stabil realpolitisk 18-emne-taksonomi.
KMeans-klyngerne bruges som teknisk kontrol og dokumentation; sitet viser de forklarlige emneforslag fra taksonomien.
Emneklassifikationen kræver enten et stærkt frase-hit eller flere emnespecifikke nøgleord, så brede enkeltord ikke alene placerer et tekststykke under et emne.
Tekstopdelingen filtrerer side-/biblioteksstøj, samler korte fragmenter og forsøger at splitte interne overskrifter i OCR-tekst, så uddrag starter tættere på det emne, de matcher.
Et dokument vises kun under et emne, når der er fundet tekststykker, som primært matcher emnet. Manglende visning betyder derfor ikke nødvendigvis manglende politisk stillingtagen.
Procentvis partinærhed beregnes som en relativ normalisering af TF-IDF/cosinus-scorer inden for ét regeringsgrundlag og ét emne. Den må ikke læses som kausal politisk indflydelse.
1994- og 2001-regeringsgrundlagene samt Fremskridtspartiets 1993-program er OCR-behandlet lokalt, fordi de originale PDF'er er billedbaserede.
DF_2009 er registreret som arbejdsprogram uden fuldtekst, fordi den aktuelle RTF-kildefil er tom.
2019-dokumentet er markeret som forståelsespapir, og 2000/2003 er markeret som supplerende regeringsgrundlag.
