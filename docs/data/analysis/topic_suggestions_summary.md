# Emneforslag

Denne fil opsummerer de analysebaserede emneforslag, der bruges på sitet.

## Datagrundlag

- Partiprogram-tekststykker med emneforslag: 973
- Regeringsgrundlag-tekststykker med emneforslag: 840
- Samlet antal tekststykker med emneforslag: 1813
- Emner i taksonomien: 24

## Emnefordeling

- Økonomi, skat og finanspolitik: 110 (partiprogrammer 47, regeringsgrundlag 63)
- Erhverv, konkurrence og iværksætteri: 109 (partiprogrammer 61, regeringsgrundlag 48)
- Arbejdsmarked og beskæftigelse: 118 (partiprogrammer 61, regeringsgrundlag 57)
- Sundhed og psykiatri: 57 (partiprogrammer 18, regeringsgrundlag 39)
- Ældre og omsorg: 25 (partiprogrammer 11, regeringsgrundlag 14)
- Børn, unge og familie: 101 (partiprogrammer 46, regeringsgrundlag 55)
- Skole, uddannelse og forskning: 142 (partiprogrammer 66, regeringsgrundlag 76)
- Socialpolitik og udsatte grupper: 62 (partiprogrammer 35, regeringsgrundlag 27)
- Klima, energi og miljø: 143 (partiprogrammer 53, regeringsgrundlag 90)
- Landbrug, fødevarer og dyrevelfærd: 25 (partiprogrammer 15, regeringsgrundlag 10)
- Udlændinge, integration og statsborgerskab: 45 (partiprogrammer 14, regeringsgrundlag 31)
- Retspolitik, politi og kriminalitet: 55 (partiprogrammer 18, regeringsgrundlag 37)
- Forsvar, sikkerhed og beredskab: 48 (partiprogrammer 22, regeringsgrundlag 26)
- EU, udenrigspolitik og globalt samarbejde: 235 (partiprogrammer 139, regeringsgrundlag 96)
- Demokrati, retsstat og forfatning: 46 (partiprogrammer 40, regeringsgrundlag 6)
- Offentlig sektor og forvaltning: 147 (partiprogrammer 75, regeringsgrundlag 72)
- Bolig, by og landdistrikter: 37 (partiprogrammer 20, regeringsgrundlag 17)
- Transport og infrastruktur: 30 (partiprogrammer 14, regeringsgrundlag 16)
- Kultur, medier og idræt: 54 (partiprogrammer 33, regeringsgrundlag 21)
- Digitalisering, teknologi og data: 16 (partiprogrammer 2, regeringsgrundlag 14)
- Ligestilling og minoriteter: 38 (partiprogrammer 25, regeringsgrundlag 13)
- Ideologi og samfundssyn: 114 (partiprogrammer 102, regeringsgrundlag 12)
- Parti og organisation: 35 (partiprogrammer 35, regeringsgrundlag 0)
- Religion, etik og værdier: 21 (partiprogrammer 21, regeringsgrundlag 0)

## Metode

Partiprogrammerne er genkørt med automatisk tekstopdeling, eksplorativ TF-IDF/KMeans-klyngeanalyse og en stabil realpolitisk 24-emne-taksonomi.
KMeans-klyngerne bruges som teknisk kontrol og dokumentation, mens sitet viser de primære emneforslag fra den forklarlige taksonomi.
Emneklassifikationen kræver enten et stærkt frase-hit eller flere emnespecifikke nøgleord, så brede enkeltord ikke alene placerer et tekststykke under et emne.
Tekstopdelingen forsøger også at splitte interne overskrifter i OCR-tekst, så uddrag starter tættere på det emne, de matcher.
Regeringsgrundlagene er opdelt med samme tekststykke-størrelser og klassificeret ind i de samme 24 emner.
Et dokument vises kun under et emne, når der er fundet tekststykker, som primært matcher emnet. Manglende visning betyder derfor ikke nødvendigvis manglende politisk stillingtagen.
Procentvis partinærhed beregnes som en relativ normalisering af TF-IDF/cosinus-scorer inden for ét regeringsgrundlag og ét emne. Den må ikke læses som kausal politisk indflydelse.
1994- og 2001-dokumenterne er OCR-behandlet lokalt, fordi de originale PDF’er er billedbaserede.
2019-dokumentet er markeret som forståelsespapir, og 2000/2003 er markeret som supplerende regeringsgrundlag.
