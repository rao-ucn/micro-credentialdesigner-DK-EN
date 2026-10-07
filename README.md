# The Micro-Credential Designer

A structured design tool for standalone courses and micro-credentials, divided into six phases: from market assessment and learning outcomes to a didactical guide, piloting, examination and evaluation.

**Live version:** https://micro-credentialdesigner.lovable.app
No login, no account, no installation – just open the link.

**Danish version:** [README.da.md](README.da.md)

## Important to know

**A development tool, used at your own risk.** This version is a design tool made available as it is. There is no guarantee of operation, support or continued development, and no one can be held responsible for lost work or errors in the documents the tool produces.

**No database or file system.** The tool stores nothing on a server. All documents exist only in your own browser, encrypted with your security code. If browser data is cleared, you switch computers, or you open the document in another browser, it is gone – unless you have exported it as JSON.

## Getting started

### 1. Use it from the web (recommended for teachers)

Open [micro-credentialdesigner.lovable.app](https://micro-credentialdesigner.lovable.app) in a browser.

- **Language:** the DA/EN button at the top switches the entire tool. ESCO search is in English (the database is English).
- **Save:** "Save" stores the document encrypted in the browser. If browser data is cleared, the document is gone – use the JSON export as a backup.
- **Share:** use "Download JSON" and share the file together with the security code. The recipient imports the file ("Import JSON") and enters the code to open or continue editing the document.

### 2. Run it locally (recommended for further development)

Requirements: [Node.js](https://nodejs.org) 20 or newer.

```sh
git clone <the address from the Code button on the repository's front page>
cd <the folder name the command creates itself>
npm install
npm run dev      # local development server
npm run build    # production build to dist/
npm run preview  # serve the production build locally
```

The tool has **no backend**: no API keys, no database, no cloud account to set up. It runs anywhere static files can be served.

**Leftovers from the platform.** The `src/integrations/supabase/` folder, the `supabase/` folder and the `.env` file come from the project's creation. The tool does not use them – no code refers to them – and they contain no secret keys, only a project ID and a public key. In a downloaded copy they can be deleted without changing the tool's behaviour.

## How it works

- **No accounts.** All documents are stored locally in each user's own browser, encrypted with a 12-character security code.
- **Sharing documents** happens through JSON export/import. Document ID and security code belong together – the ID alone is not enough to open a document.
- **PDF export** (design guide and didactical guide) follows the language selected in the tool.
- **The phases** are in `src/data/phases.ts` (English) and `src/data/phases.da.ts` (Danish).

## Project structure

| Path | What |
| --- | --- |
| `src/pages/Index.tsx` | The tool itself: welcome screen, phases, save/load, export/import |
| `src/components/` | The individual phase forms |
| `src/contexts/LanguageContext.tsx` | DA/EN language toggle |
| `src/lib/storage.ts` | Encrypted local storage (`mcd:` keys in the browser) |
| `src/lib/pdf.ts` | PDF export, language-aware |
| `src/lib/translations/` | Danish and English text keys |
| `src/data/phases.ts`, `phases.da.ts` | Phase and step content |

## Brand and language

- Brand colour: petrol `#195562`, defined as a semantic token in `src/index.css` – change it in one place to change the theme.
- The app is language-neutral and free of alliance branding, so it can be used by anyone.
- "Standalone" is used as the term across both languages.

## Publishing

`npm run build` produces `dist/`, which can be placed on any static host (Netlify, Cloudflare Pages, your own server). To edit the tool via Lovable you need a Lovable account – but that is not a requirement for running or hosting the code.
