# Emneforslag

Denne fil opsummerer de analysebaserede emneforslag, der bruges på sitet.

## Datagrundlag

- Partiprogram-tekststykker med emneforslag: 1399
- Regeringsgrundlag-tekststykker med emneforslag: 839
- Samlet antal tekststykker med emneforslag: 2238
- Emner i taksonomien: 16

## Emnefordeling

- Økonomi, skat og finanspolitik: 102 (partiprogrammer 51, regeringsgrundlag 51)
- Erhverv, arbejdsmarked og beskæftigelse: 350 (partiprogrammer 208, regeringsgrundlag 142)
- Offentlig sektor, velfærd og forvaltning: 187 (partiprogrammer 111, regeringsgrundlag 76)
- Sundhed, ældre og omsorg: 113 (partiprogrammer 64, regeringsgrundlag 49)
- Børn, familie og socialpolitik: 226 (partiprogrammer 121, regeringsgrundlag 105)
- Skole, uddannelse og forskning: 149 (partiprogrammer 90, regeringsgrundlag 59)
- Klima, miljø, energi og landbrug: 208 (partiprogrammer 108, regeringsgrundlag 100)
- Udlændinge, integration og statsborgerskab: 58 (partiprogrammer 33, regeringsgrundlag 25)
- Retspolitik, politi og kriminalitet: 68 (partiprogrammer 35, regeringsgrundlag 33)
- Forsvar, sikkerhed og beredskab: 51 (partiprogrammer 27, regeringsgrundlag 24)
- EU, udenrigspolitik og internationalt samarbejde: 257 (partiprogrammer 171, regeringsgrundlag 86)
- Demokrati, retsstat og forfatning: 60 (partiprogrammer 52, regeringsgrundlag 8)
- Bolig, transport og landdistrikter: 96 (partiprogrammer 56, regeringsgrundlag 40)
- Kultur, religion, medier og værdier: 108 (partiprogrammer 88, regeringsgrundlag 20)
- Ligestilling, minoriteter og rettigheder: 44 (partiprogrammer 33, regeringsgrundlag 11)
- Ideologi, parti og samfundssyn: 161 (partiprogrammer 151, regeringsgrundlag 10)

## Metode

Partiprogrammer og regeringsgrundlag er genkørt med automatisk tekstopdeling, TF-IDF/KMeans-klyngekontrol og en stabil realpolitisk 16-emne-taksonomi.
KMeans-klyngerne bruges som teknisk kontrol og dokumentation; sitet viser de forklarlige emneforslag fra taksonomien.
Emneklassifikationen kræver enten et stærkt frase-hit eller flere emnespecifikke nøgleord, så brede enkeltord ikke alene placerer et tekststykke under et emne.
Tekstopdelingen filtrerer side-/biblioteksstøj, samler korte fragmenter og forsøger at splitte interne overskrifter i OCR-tekst, så uddrag starter tættere på det emne, de matcher.
Et dokument vises kun under et emne, når der er fundet tekststykker, som primært matcher emnet. Manglende visning betyder derfor ikke nødvendigvis manglende politisk stillingtagen.
Procentvis partinærhed beregnes som en relativ normalisering af TF-IDF/cosinus-scorer inden for ét regeringsgrundlag og ét emne. Den må ikke læses som kausal politisk indflydelse.
1994- og 2001-regeringsgrundlagene samt Fremskridtspartiets 1993-program er OCR-behandlet lokalt, fordi de originale PDF'er er billedbaserede.
DF_2009 er registreret som arbejdsprogram uden fuldtekst, fordi den aktuelle RTF-kildefil er tom.
2019-dokumentet er markeret som forståelsespapir, og 2000/2003 er markeret som supplerende regeringsgrundlag.
