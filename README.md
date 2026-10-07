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
git clone https://github.com/rao-ucn/micro-credentialdesigner-DK-EN.git
cd micro-credentialdesigner-DK-EN
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

## Building English-only

The Danish layer is optional, and removing it is two small edits:

1. In `src/pages/Index.tsx`, delete the two lines that contain `<LanguageToggle />`.
2. In `src/contexts/LanguageContext.tsx`, change the fallback `return 'da';` to `return 'en';`.

That is all it takes: the welcome screen, every phase and both PDF exports then come out in English, and the DA/EN button is gone. The Danish wording can simply stay in the files – it is never loaded, and the build passes with it in place.

**If you would rather delete it**, the Danish text sits in:

- the `da:` block in each file under `src/lib/translations/`
- `src/data/phases.da.ts`, which `src/data/phases.ts` imports – drop the `import { phasesDa }` line and the `lang === 'da' ? phasesDa : phases` line in the same change, or the build breaks
- `src/components/LanguageToggle.tsx`
- the Danish verb list `VERBS_BY_DOMAIN_DA` in `src/components/LearningOutcomesForm.tsx`

Verified in this project: with the two edits applied, the type check passes and the app runs in English with no errors in the browser.

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
