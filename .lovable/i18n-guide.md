# i18n Implementation Guide — Danish Translation

This file is the SINGLE source of truth for the ongoing DA/EN translation effort. Every agent translating files MUST read and follow this guide exactly.

## Context

- App: "The Micro-Credential Designer" — React 18 + Vite + TypeScript + Tailwind.
- Language system: `src/contexts/LanguageContext.tsx` exports `useLanguage()` → `{ language, setLanguage, t }`.
  - `language` is `'en' | 'da'`, default `'da'`, persisted in localStorage.
  - `t` is the global core dictionary from `src/lib/i18n.ts` (DO NOT edit i18n.ts — orchestrator owns it).
- Goal: EVERY user-facing string must render in Danish when language is 'da'. PDF exports must follow the selected language.

## Mandatory pattern for components

Each translation group owns a LOCAL dictionary file under `src/lib/translations/`. Components import their own dictionary — do NOT add keys to `src/lib/i18n.ts`.

```ts
// src/lib/translations/<group>.ts
export const <group>Translations = {
  en: { myKey: 'English text' },
  da: { myKey: 'Dansk tekst' },
};
```

```tsx
// in component
import { useLanguage } from '@/contexts/LanguageContext';
import { <group>Translations } from '@/lib/translations/<group>';

const { language, t } = useLanguage();   // t = global core dict (save, required, optional, etc.)
const lt = <group>Translations[language]; // local dict for this group's strings
```

Rules:
- `en` and `da` key sets MUST be identical. Keys camelCase with a semantic prefix (e.g. `assessmentTitle`).
- Common words you need (Add, Remove, Close, Yes, No, etc.) go in YOUR local dict — do not rely on them existing in the global `t`.
- Translate ALL user-facing text: labels, headings, buttons, placeholders, help/guidance/tooltip texts, validation + toast messages, table headers, empty states, confirmation dialogs.
- NEVER change: field `name`s, item/phase `id`s, option VALUES (e.g. `'standalone'`, `'micro-credential'`), data structures, function signatures (except where the task explicitly says so), storage keys, or logic.
- Do not translate console.logs or code comments (optional).
- Do NOT run the dev server, do NOT edit files outside your assigned list.
- You may check your work with `bunx tsgo --noEmit` (pre-existing errors in files you did not touch can be ignored — orchestrator does final verification).

## Danish terminology (STRICT — use exactly these)

| English | Danish |
|---|---|
| micro-credential | micro-credential (keep English word, also in Danish) |
| standalone course | **standalone-kursus** — NEVER "selvstændigt kursus". Short label: "Standalone" |
| composite micro-credential | sammensat micro-credential |
| course type | kursustype |
| course design | kursusdesign |
| learning outcomes | læringsmål |
| overall aim | overordnet formål |
| target audience | målgruppe |
| learners | de lærende (or "deltagerne" where more natural) |
| market needs | arbejdsmarkedets behov |
| assessment (of learners) | evaluering |
| assessment design / define assessment | evalueringsdesign / definér evaluering |
| resit | omprøve |
| (course) evaluation plan | evalueringsplan |
| prerequisites | forudsætninger |
| learning activities | læringsaktiviteter |
| topics and themes | emner og temaer |
| glossary | ordliste |
| key terms | nøglebegreber |
| constructive alignment | constructive alignment (keep English term) |
| multimodal learning resources | multimodale læringsressourcer |
| supplementary considerations | supplerende overvejelser |
| technical requirements | tekniske krav |
| platform compatibility | platformskompatibilitet |
| accessibility | tilgængelighed |
| engagement | engagement |
| scalability | skalerbarhed |
| content reuse | genbrug af indhold |
| meeting learner needs | imødekommelse af de lærendes behov |
| workload | arbejdsbyrde |
| ECTS credits | ECTS-point |
| EQF level | EQF-niveau |
| EQF dimensions: Knowledge / Skills / Competence | Viden / Færdigheder / Kompetencer |
| feedback mechanisms | feedbackmekanismer |
| Bloom's taxonomy | Blooms taksonomi |
| Bloom verbs (revised) | huske, forstå, anvende, analysere, evaluere, skabe |
| didactical guide | didaktisk vejledning |
| working title | arbejdstitel |
| developers | udviklere |
| institution | institution |
| approved activity | godkendt aktivitet |
| document ID | dokument-ID |
| security code | sikkerhedskode |
| phase / item | fase / punkt |
| required / optional | påkrævet / valgfri(t) |
| save / export / import / delete | gem / eksportér / importér / slet |
| next / previous | næste / forrige |
| checklist | tjekliste |
| completion | færdiggørelse |
| credit bearing / non-credit bearing | pointgivende / ikke pointgivende |
| labour market | arbejdsmarked |
| interdisciplinary / cross-sector | tværfaglige / tværsektorielle |
| learning pathways | læringsveje |
| delivery (of content) | levering (af indhold) |
| metadata | metadata |
| quality assurance / QA | kvalitetssikring |
| recognition | anerkendelse |
| sustainability | bæredygtighed |
| transparency | gennemsigtighed |

## Tone

- Danish "du"-form, professional educational language (as used in Danish university college contexts).
- Keep sentences natural Danish — do not translate word-for-word.
- Technical English terms of art may stay English where that is normal in Danish HE (e.g. constructive alignment, micro-credential, standalone, ECTS, EQF, WCAG, LMS).

## Brand constraints (unchanged)

- Primary color petrol #195562 — do not touch styling.
- No HEROES branding anywhere. No cloud-save features.
