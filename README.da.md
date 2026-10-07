# The Micro-Credential Designer

**Engelsk udgave:** [README.md](README.md)

Et struktureret designværktøj til standalone-kurser og micro-credentials, opdelt i seks faser: fra markedsvurdering og læringsmål til didaktisk guide, afprøvning, eksamen og evaluering.

**Live version:** https://micro-credentialdesigner.lovable.app
Ingen login, ingen konto, ingen installation – åbn bare linket.

## Vigtigt at vide

**Udviklingsværktøj på eget ansvar.** Denne version er et designværktøj, der stilles til rådighed, som det er. Der er ingen garanti for drift, support eller fortsat videreudvikling, og ingen kan holdes ansvarlig for tabt arbejde eller fejl i de dokumenter, værktøjet producerer.

**Ingen database eller filsystem.** Værktøjet gemmer intet på en server. Alle dokumenter findes kun i din egen browser, krypteret med din sikkerhedskode. Slettes browserdata, skiftes computer eller åbnes dokumentet i en anden browser, er det væk – medmindre du har eksporteret det som JSON.

## Kom i gang

### 1. Brug den fra nettet (anbefales til undervisere)

Åbn [micro-credentialdesigner.lovable.app](https://micro-credentialdesigner.lovable.app) i en browser.

- **Sprog:** DA/EN-knappen i toppen skifter hele værktøjet. ESCO-søgningen er på engelsk (databasen er engelsk).
- **Gem:** "Gem" gemmer dokumentet krypteret i browseren. Ryddes browserdata, er dokumentet væk – brug derfor JSON-eksporten som backup.
- **Del:** Eksportér JSON-filen, og del den sammen med sikkerhedskoden. Modtageren importerer filen og indtaster koden for at åbne eller viderebearbejde dokumentet.

### 2. Kør den lokalt (anbefales til videreudvikling)

Krav: [Node.js](https://nodejs.org) 20 eller nyere.

```sh
git clone https://github.com/rao-ucn/micro-credentialdesigner-DK-EN.git
cd micro-credentialdesigner-DK-EN
npm install
npm run dev      # lokal udviklingsserver
npm run build    # produktionsbyg til dist/
npm run preview  # vis produktionsbygget lokalt
```

Værktøjet har **ingen backend**: ingen API-nøgler, ingen database, ingen cloud-konto at sætte op. Det kører, hvor som helst der kan servere statiske filer.

**Rest fra platformen.** Mappen `src/integrations/supabase/`, mappen `supabase/` og filen `.env` stammer fra projektets oprettelse. Værktøjet bruger dem ikke – ingen kode refererer til dem – og de indeholder ingen hemmelige nøgler, kun et projekt-id og en offentlig nøgle. I en downloadet kopi kan de slettes uden at ændre ved funktionen.

## Sådan virker det

- **Ingen konti.** Alle dokumenter gemmes lokalt i den enkelte brugers browser, krypteret med en sikkerhedskode på 12 tegn.
- **Deling af dokumenter** sker via JSON-eksport/-import. Dokument-ID og sikkerhedskode hører sammen – ID alene rækker ikke for at åbne et dokument.
- **PDF-eksport** (designvejledning og didaktisk guide) følger det sprog, der er valgt i værktøjet.
- **Faserne** ligger i `src/data/phases.ts` (engelsk) og `src/data/phases.da.ts` (dansk).

## Projektstruktur

| Sti | Hvad |
| --- | --- |
| `src/pages/Index.tsx` | Selve værktøjet: velkomstskærm, faser, gem/hent, eksport/import |
| `src/components/` | De enkelte fase-skemaer |
| `src/contexts/LanguageContext.tsx` | DA/EN-sprogskift |
| `src/lib/storage.ts` | Krypteret lokalt lager (`mcd:`-nøgler i browseren) |
| `src/lib/pdf.ts` | PDF-eksport, sprogafhængig |
| `src/lib/translations/` | Danske og engelske tekstnøgler |
| `src/data/phases.ts`, `phases.da.ts` | Fase- og trinindhold |

## Brand og sprog

- Brandfarve: petrol `#195562`, defineret som semantisk token i `src/index.css` – ret den ét sted for at ændre temaet.
- Appen er sprogneutral og uden alliance-branding, så den kan bruges af alle.
- "Standalone" bruges som betegnelse på tværs af begge sprog.

## Udgivelse

`npm run build` producerer `dist/`, som kan lægges på enhver statisk host (Netlify, Cloudflare Pages, egen server). Vil du redigere i værktøjet via Lovable, skal du bruge en Lovable-konto – men det er ikke en forudsætning for at køre eller hoste koden.
