# Projektbrief: De politiske principper

## Projektets formål
Dette projekt skal udvikle en offentlig kildesite, hvor brugere kan læse og sammenligne danske partiers principprogrammer i deres egen tekstform.

Projektets kerne er ikke analyse, fortolkning eller journalistisk bearbejdning i første omgang. Formålet er i stedet at gøre partiernes egne principprogrammer tilgængelige i en overskuelig, sammenlignelig og brugervenlig form.

Sitet skal gøre det muligt at:
- læse partiernes egne formuleringer om bestemte emner
- sammenligne flere partier på samme emne
- følge det enkelte partis principprogrammer over tid
- se ældre og historiske principprogrammer side om side med nyere programmer

Det originale bidrag er derfor ikke en ny tolkning af materialet, men en ny måde at organisere, vise og sammenstille primærkilderne på.

## Arbejdstitel
**De politiske principper**

Andre mulige titler kan overvejes senere, men dette er foreløbigt projektets arbejdstitel.

## Hvad projektet er
Projektet er en **kildesite**.

Det betyder:
- fokus på originaltekst
- fokus på kildeformidling
- fokus på sammenlignelighed
- fokus på historisk udvikling

Det betyder også:
- ingen større analyser i første version
- ingen omskrivning af partiernes indhold til egne konklusioner
- ingen tung akademisk formidling på selve sitet i første omgang

Der må gerne være korte forklarende rammer omkring materialet, men hovedindholdet skal være partiernes egne tekster.

## Minimum viable product (MVP)
Første version skal være enkel, tydelig og realistisk.

MVP'en skal gøre det muligt at:
1. vælge et emne
2. vælge et eller flere partier
3. se de relevante tekstuddrag fra principprogrammerne
4. sammenligne partierne på tværs
5. følge et parti over tid gennem flere historiske programmer

Første version skal altså ikke forsøge at kunne alt. Den skal først og fremmest fungere som en stabil og troværdig base.

## Indholdsmæssigt udgangspunkt
Projektet starter med de partier og programmer, som allerede indgår i specialets materiale.

Det vil sige, at første version tager udgangspunkt i de tre statsministerpartier:
- Socialdemokratiet
- Venstre
- Det Konservative Folkeparti

Første version bygger på de renskrevne tekstdokumenter, som allerede er tilgængelige.

## Kildematerialets placering og navngivning
Teksterne ligger i mappen:

`Programmer-text`

Filerne er `.docx`-dokumenter.

Filnavnene følger strukturen:

`Parti_årstal_programnavn`

Eksempel:

`K_1970_70'ernes folkeparti.docx`

Det skal læses som:
- `K` = parti
- `1970` = årstal
- resten = programmets navn

Det er vigtigt, at projektet fra starten bygger på denne filstruktur, så data kan læses og organiseres konsistent.

## Grundprincip for databehandling
Projektet skal i første omgang bygges med en manuel og kontrolleret opdeling af materialet.

Det betyder, at emner og tekstuddrag udvælges manuelt frem for automatisk topic modelling eller anden tung NLP.

Det er et bevidst valg, fordi:
- materialet er afgrænset
- præcision er vigtigere end automatisering i første version
- manuel udvælgelse giver bedre kontrol med, hvilke afsnit der faktisk hører til hvilke emner
- backend og datastruktur dermed kan holdes enkel og stabil

Samtidig skal strukturen fra starten bygges sådan, at nye partier let kan tilføjes senere, uden at projektet skal bygges om fra bunden. Første version tager udgangspunkt i tre partier, men løsningen må ikke være låst til netop disse tre. Data- og frontendstrukturen skal derfor være generisk, så det er enkelt at tilføje flere partier og flere programmer på sigt.

Projektet skal også være udvideligt. Det betyder, at første version skal bygges med en struktur, som senere kan bære nye lag ovenpå, for eksempel søgning, flere metadatafelter, semantiske mål som cosine similarity eller andre analytiske funktioner. Udviklingen skal derfor ske modulært, så senere versioner kan bygges videre på det eksisterende grundlag i stedet for at kræve en total genopbygning.

## Visningslogik
Sitet skal kunne vise materialet på mindst to måder:

### 1. Sammenligning på tværs af partier
Brugeren vælger et emne og ser relevante tekstuddrag fra flere partier.

Eksempel:
- Emne: klima
- Vis: Socialdemokratiet, Venstre og Konservative
- Resultat: uddrag fra de relevante principprogrammer for hvert parti

### 2. Udvikling over tid inden for ét parti
Brugeren vælger et parti og et emne og ser, hvordan formuleringerne ændrer sig gennem historiske programmer.

Eksempel:
- Parti: Venstre
- Emne: velfærd
- Resultat: uddrag fra 1970, 1979, 1986, 1995, 2006 og 2025

Begge visninger er centrale for projektets identitet.

## Hvad der skal vises
I første version skal der primært vises:
- originale tekstuddrag
- parti
- årstal
- programtitel

Det skal være tydeligt, at teksten kommer fra et principprogram og ikke er skrevet til sitet.

Det er vigtigt, at sitet fremstår som et sted, hvor man læser kilderne direkte.

Der skal desuden være plads til ekstra programmetadata, som kan bruges allerede i første version eller tilføjes kort efter. Det gælder især:
- link til det nyeste program på partiets egen hjemmeside, når et officielt link findes
- mulighed for en kort redaktionel konteksttekst om programmet
- mulighed for at notere hvordan og hvornår programmet blev til

Denne konteksttekst skal ikke være en egentlig analyse, men en kort, informativ ramme om programmet som dokument. Det kan for eksempel være oplysninger om vedtagelsesår, partiledelse, organisatorisk baggrund, bestillingen af programmet eller den politiske situation omkring dets tilblivelse.

Et eksempel kunne være, at et program ledsages af en kort tekst om, at det blev til i kølvandet på et formandsskifte, at den nye partiledelse bestilte programmet, og hvem der fik ansvaret for processen. Den type information kan styrke forståelsen af programmet som historisk kilde, uden at sitet dermed bliver et fortolkningssite.

## Hvad der ikke er vigtigt i første version
Følgende skal ikke styre udviklingen nu:
- avanceret analyse
- automatiseret klassifikation
- store visuelle eksperimenter
- kompliceret søgning
- fortolkende lag skrevet af projektets ejer

Det vigtigste nu er struktur, troværdighed og brugbar visning.

## Mulig senere udvidelse
En mulig senere funktion kan være at tilføje et meget begrænset analytisk lag, for eksempel cosine similarity eller anden semantisk nærhed mellem partiernes formuleringer om et emne.

Denne idé skal ikke være centrum for første version.

Den må gerne holdes i baghovedet som en mulig fase 2, men projektet skal først lykkes som kildesite, før der lægges analytiske funktioner ovenpå.

## Foreslået informationsarkitektur
Sitet bør bygges omkring en enkel struktur.

### Centrale enheder
- parti
- år
- programtitel
- emne
- tekstuddrag

### Forslag til emner i første version
De endelige emner kan justeres, men en første arbejdsliste kunne være:
- frihed
- statens rolle
- velfærd
- familie
- skat og økonomi
- erhverv
- klima og miljø
- udlændinge og integration
- EU og internationalt samarbejde
- forsvar og sikkerhed

Ikke alle emner behøver være med fra dag ét. Det vigtigste er at starte med et begrænset antal emner, der er tydelige i materialet.

## Foreslået dataformat
Projektet bør omdanne indholdet fra `.docx`-filerne til en enkel struktureret form, som sitet kan læse direkte.

Et oplagt mål er en datastruktur, hvor hvert program har metadata og emneopdelte tekstuddrag.

Eksempel på logik:
- parti
- år
- titel
- original fil
- eksternt link til officiel programside, hvis relevant
- kort konteksttekst om programmets tilblivelse eller placering i partiets historie
- emner
  - emnenavn
  - et eller flere tekstuddrag

Det vigtigste er ikke den endelige tekniske model endnu, men at strukturen understøtter manuel kuratering, enkel visning og senere udvidelser.

Datastrukturen skal desuden være fremtidssikker nok til, at der senere kan kobles ekstra felter på uden større omskrivning. Det gælder for eksempel analytiske mål, relationer mellem programmer, beregnede ligheder eller andre udvidelser.

## UX-principper
Sitet skal være roligt, læsbart og kildecentreret.

Det betyder:
- få visuelle distraktioner
- tydelig typografi
- klar opdeling mellem partier og år
- let navigation mellem emner
- mobilvenligt layout
- fokus på læsning frem for flashy interaktion

Det bør føles mere som et digitalt arkiv eller et læsevenligt sammenligningsværktøj end som en klassisk nyhedsside.

## Forslag til første udviklingsfase
Første fase bør fokusere på at få en fungerende kerne op.

### Fase 1
- læs filerne fra `Programmer-text`
- registrér metadata ud fra filnavne
- vælg et lille antal emner manuelt
- opret tekstuddrag manuelt
- gem data i en enkel struktur
- byg en simpel frontend der kan vise emne + parti + år

### Fase 2
- tilføj sammenligning mellem partier
- tilføj visning over tid inden for ét parti
- forbedr navigation og design

### Fase 3
- overvej søgning
- overvej flere partier
- overvej analytiske lag som cosine similarity

## Teknisk retning
Projektet skal bygges i VS Code.

Der ønskes en enkel, robust og overskuelig struktur frem for en tung og kompleks løsning.

Udviklingen bør derfor starte med fokus på:
- klar mappestruktur
- enkel datamodel
- let vedligeholdelse
- mulighed for senere udvidelse
- generisk håndtering af partier og programmer
- modulær struktur, så nye funktioner kan lægges ovenpå uden omskrivning af hele projektet

Det er vigtigt, at både dataflow og frontend tænkes som noget, der kan skaleres roligt. Der skal være en tydelig vej fra første version med få partier og manuelle emner til en senere version med flere partier, flere programmer, mere metadata og eventuelle analytiske funktioner.

## Succeskriterium for første version
Første version er en succes, hvis en bruger uden forkundskaber kan:
- vælge et politisk emne
- se hvad forskellige partier faktisk skriver om det
- forstå hvilket program teksten kommer fra
- se forskelle mellem partierne
- se udvikling over tid

Hvis det lykkes, har projektet allerede en stærk offentlig værdi.

## Praktisk udviklingsmål lige nu
Det næste konkrete mål er ikke at bygge hele siden færdig på én gang.

Det næste mål er at etablere projektets grundstruktur:
1. definere dataformat
2. definere de første emner
3. organisere de første tekstuddrag
4. bygge en enkel prototype for visning

## Kort projektresume
**De politiske principper** er en offentlig kildesite for danske principprogrammer.

Sitet skal ikke i første omgang analysere partiernes ideologi, men gøre det muligt at læse partiernes egne formuleringer i en ny og mere brugervenlig sammenhæng.

Kernen er at sammenligne:
- partier med hinanden
- partier med sig selv over tid

Projektet starter med de tre statsministerpartier og de eksisterende renskrevne `.docx`-filer i mappen `Programmer-text`.

Første version skal være enkel, manuel og kildecentreret.

