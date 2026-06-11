# Emneforslag

Denne fil opsummerer de analysebaserede emneforslag, der bruges på sitet.

## Datagrundlag

- Partiprogram-tekststykker med emneforslag: 1778
- Regeringsgrundlag-tekststykker med emneforslag: 890
- Samlet antal tekststykker med emneforslag: 2668
- Emner i taksonomien: 18

## Emnefordeling

- Økonomi, skat og finanspolitik: 197 (partiprogrammer 137, regeringsgrundlag 60)
- Erhverv, arbejdsmarked og beskæftigelse: 352 (partiprogrammer 216, regeringsgrundlag 136)
- Offentlig sektor, velfærd og forvaltning: 118 (partiprogrammer 65, regeringsgrundlag 53)
- Sundhed og psykiatri: 103 (partiprogrammer 58, regeringsgrundlag 45)
- Ældre, pension og omsorg: 68 (partiprogrammer 46, regeringsgrundlag 22)
- Børn, familie og socialpolitik: 186 (partiprogrammer 94, regeringsgrundlag 92)
- Skole, uddannelse og forskning: 215 (partiprogrammer 136, regeringsgrundlag 79)
- Klima, miljø og energi: 139 (partiprogrammer 59, regeringsgrundlag 80)
- Landbrug, fødevarer og dyrevelfærd: 71 (partiprogrammer 59, regeringsgrundlag 12)
- Udlændinge, integration og statsborgerskab: 92 (partiprogrammer 58, regeringsgrundlag 34)
- Retspolitik, politi og kriminalitet: 105 (partiprogrammer 65, regeringsgrundlag 40)
- Forsvar, sikkerhed og beredskab: 79 (partiprogrammer 46, regeringsgrundlag 33)
- EU, udenrigspolitik og internationalt samarbejde: 342 (partiprogrammer 238, regeringsgrundlag 104)
- Demokrati, retsstat og forfatning: 91 (partiprogrammer 82, regeringsgrundlag 9)
- Bolig, transport, by og landdistrikter: 110 (partiprogrammer 72, regeringsgrundlag 38)
- Kultur, religion, medier og værdier: 143 (partiprogrammer 115, regeringsgrundlag 28)
- Ligestilling, minoriteter og rettigheder: 75 (partiprogrammer 64, regeringsgrundlag 11)
- Ideologi, parti og samfundssyn: 182 (partiprogrammer 168, regeringsgrundlag 14)

## Metode

Partiprogrammer og regeringsgrundlag er genkørt med automatisk tekstopdeling, TF-IDF/KMeans-klyngekontrol og en stabil realpolitisk 18-emne-taksonomi.
KMeans-klyngerne bruges som teknisk kontrol og dokumentation; sitet viser de forklarlige emneforslag fra taksonomien.
Emneklassifikationen kræver enten et stærkt frase-hit eller flere emnespecifikke nøgleord, så brede enkeltord ikke alene placerer et tekststykke under et emne.
Tekstopdelingen filtrerer side-/biblioteksstøj, samler korte fragmenter og forsøger at splitte interne overskrifter i OCR-tekst, så uddrag starter tættere på det emne, de matcher.
Et dokument vises kun under et emne, når der er fundet tekststykker, som primært matcher emnet. Manglende visning betyder derfor ikke nødvendigvis manglende politisk stillingtagen.
Procentvis partinærhed beregnes som en relativ normalisering af TF-IDF/cosinus-scorer mellem partier med identificeret emnetekst. Primær emnetekst bruges direkte; sekundære og brede emnesignaler indgår med lavere vægt.
Partier uden identificeret emnesignal vises særskilt og tæller ikke som 0%.
Indikatoren må ikke læses som kausal politisk indflydelse.
1994- og 2001-regeringsgrundlagene samt Fremskridtspartiets 1993-program er OCR-behandlet lokalt, fordi de originale PDF'er er billedbaserede.
Dansk Folkepartis 2009-tekst er registreret som arbejdsprogram, fordi partiet selv bruger den betegnelse.
2019-dokumentet er markeret som forståelsespapir, og 2000/2003 er markeret som supplerende regeringsgrundlag.
