# Emneforslag

Denne fil opsummerer de analysebaserede emneforslag, der bruges på sitet.

## Datagrundlag

- Partiprogram-tekststykker med emneforslag: 1381
- Regeringsgrundlag-tekststykker med emneforslag: 840
- Samlet antal tekststykker med emneforslag: 2221
- Emner i taksonomien: 24

## Emnefordeling

- Økonomi, skat og finanspolitik: 131 (partiprogrammer 68, regeringsgrundlag 63)
- Erhverv, konkurrence og iværksætteri: 122 (partiprogrammer 74, regeringsgrundlag 48)
- Arbejdsmarked og beskæftigelse: 139 (partiprogrammer 82, regeringsgrundlag 57)
- Sundhed og psykiatri: 80 (partiprogrammer 41, regeringsgrundlag 39)
- Ældre og omsorg: 41 (partiprogrammer 27, regeringsgrundlag 14)
- Børn, unge og familie: 126 (partiprogrammer 71, regeringsgrundlag 55)
- Skole, uddannelse og forskning: 171 (partiprogrammer 95, regeringsgrundlag 76)
- Socialpolitik og udsatte grupper: 77 (partiprogrammer 50, regeringsgrundlag 27)
- Klima, energi og miljø: 164 (partiprogrammer 74, regeringsgrundlag 90)
- Landbrug, fødevarer og dyrevelfærd: 39 (partiprogrammer 29, regeringsgrundlag 10)
- Udlændinge, integration og statsborgerskab: 73 (partiprogrammer 42, regeringsgrundlag 31)
- Retspolitik, politi og kriminalitet: 77 (partiprogrammer 40, regeringsgrundlag 37)
- Forsvar, sikkerhed og beredskab: 57 (partiprogrammer 31, regeringsgrundlag 26)
- EU, udenrigspolitik og globalt samarbejde: 271 (partiprogrammer 175, regeringsgrundlag 96)
- Demokrati, retsstat og forfatning: 60 (partiprogrammer 54, regeringsgrundlag 6)
- Offentlig sektor og forvaltning: 177 (partiprogrammer 105, regeringsgrundlag 72)
- Bolig, by og landdistrikter: 51 (partiprogrammer 34, regeringsgrundlag 17)
- Transport og infrastruktur: 36 (partiprogrammer 20, regeringsgrundlag 16)
- Kultur, medier og idræt: 68 (partiprogrammer 47, regeringsgrundlag 21)
- Digitalisering, teknologi og data: 17 (partiprogrammer 3, regeringsgrundlag 14)
- Ligestilling og minoriteter: 48 (partiprogrammer 35, regeringsgrundlag 13)
- Ideologi og samfundssyn: 130 (partiprogrammer 118, regeringsgrundlag 12)
- Parti og organisation: 40 (partiprogrammer 40, regeringsgrundlag 0)
- Religion, etik og værdier: 26 (partiprogrammer 26, regeringsgrundlag 0)

## Metode

Partiprogrammerne er genkørt med automatisk tekstopdeling, eksplorativ TF-IDF/KMeans-klyngeanalyse og en stabil realpolitisk 24-emne-taksonomi.
KMeans-klyngerne bruges som teknisk kontrol og dokumentation, mens sitet viser de primære emneforslag fra den forklarlige taksonomi.
Emneklassifikationen kræver enten et stærkt frase-hit eller flere emnespecifikke nøgleord, så brede enkeltord ikke alene placerer et tekststykke under et emne.
Tekstopdelingen forsøger også at splitte interne overskrifter i OCR-tekst, så uddrag starter tættere på det emne, de matcher.
Regeringsgrundlagene er opdelt med samme tekststykke-størrelser og klassificeret ind i de samme 24 emner.
Et dokument vises kun under et emne, når der er fundet tekststykker, som primært matcher emnet. Manglende visning betyder derfor ikke nødvendigvis manglende politisk stillingtagen.
Procentvis partinærhed beregnes som en relativ normalisering af TF-IDF/cosinus-scorer inden for ét regeringsgrundlag og ét emne. Den må ikke læses som kausal politisk indflydelse.
1994- og 2001-regeringsgrundlagene samt Fremskridtspartiets 1993-program er OCR-behandlet lokalt, fordi de originale PDF’er er billedbaserede.
DF_2009 er registreret som arbejdsprogram uden fuldtekst, fordi den aktuelle RTF-kildefil er tom.
2019-dokumentet er markeret som forståelsespapir, og 2000/2003 er markeret som supplerende regeringsgrundlag.
