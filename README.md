# IBSync

**Other IBS apps help you keep a diary. IBSync turns that diary into a better doctor visit, with medicines that make sense and food that's actually Singaporean.**

Tencent Cloud × AI Singapore "AI CAN DO IT" Hackathon 2026 · Healthcare track (NTU LKC Medicine) · **Challenge Statement 2: AI Healthier Every Day, Intelligent Support for Long-Term Self-Care**

---

## Why IBSync (our edge)

There are already many IBS apps. Here's what we found when we looked at them, and where IBSync is different.

| Type | Examples | What they do | What they miss |
|---|---|---|---|
| Food and symptom diaries | mySymptoms, Cara Care (English version), myIBS | Logging, some pattern-finding, exports | Don't focus on medicines, Western food lists, English-first |
| Gut-brain therapy programmes | Nerva (now includes Mahana's CBT content), Lin Health | Hypnotherapy or CBT courses | US-focused, about US$199 a year, not tracking or care coordination |
| Clinician-led care programmes | Oshi, Ayble, Salvo | Virtual visits with specialists | Need US insurance, limited to some US states |
| FODMAP food tools | Monash, Fig, Spoonful | Food data and barcode scanning | Food only |

Some features overlap: myIBS includes a Rome IV questionnaire, and mySymptoms exports reports. Our edge isn't one feature. It's the combination, built for Singapore. We didn't find an app that does all five of these:

1. **It's designed around the care journey, not just tracking.** IBSync covers both people who *think* they might have IBS and people managing a diagnosis. It produces a GP-ready summary mapped to the Rome IV symptom criteria doctors use, questions to bring, and a schedule of appointments, tests and check-ups. This fits Singapore's Healthier SG push towards an ongoing relationship with one family doctor.
2. **It does medicines properly, which the diaries mostly don't.** It covers all three medicine features in the challenge statement:
   - **Understanding:** a plain-language explanation of each medicine, and an honest "I'm not able to identify that medication, please check with your pharmacist" when it doesn't recognise one.
   - **Management:** your own medicines, dose times, as-needed doses and refill countdowns.
   - **Adherence:** taken-rate for each dose time (e.g. "your 18:45 dose is taken 64% of the time"), the reason behind each missed dose ("eating out, forgot to bring it"), and a tip for that specific reason.
3. **It's local where it matters.**
   - Hawker dishes are broken down into likely trigger ingredients. Kopi with condensed milk counts as dairy plus caffeine, so the app can say the problem is the dairy, not the coffee. That matters because lactose intolerance is very common among East and South Asians.
   - It works in English, 中文, Bahasa Melayu and தமிழ்.
   - It points people to local help: 995, the SOS hotline on 1767, polyclinics and CHAS subsidies.
4. **The AI is designed to be trusted.** The numbers come from code and the AI only explains them, so it can't invent statistics.
   - Fixed safety rules run before the AI sees anything: emergencies, crisis language, dose-change questions and unknown medicines.
   - Dosing instructions are removed from AI replies, and it never claims to diagnose.
   - The AI only receives a de-identified summary. Everything else stays on the phone, and the app still works with no AI connection at all.
5. **It has a realistic route to real users.** Instead of selling to the public, polyclinics or Healthier SG family doctors recommend IBSync, and patients bring the summary to the visit (B2B2C). This is the opposite of the US insurance-based model above.

**How the edge lines up with the judging criteria**

| Criterion | Where IBSync scores |
|---|---|
| Impact & Relevance | Closes the loop from daily life to the consult; serves undiagnosed people, not just diagnosed patients |
| Human-Centred Design / UX & Accessibility | Four languages, three text sizes, simpler-wording mode, reduced motion, status shown by shape as well as colour, calm palette, Flare mode |
| AI Interaction | Grounded overview, plan for today, insight for each section, doctor questions, chat in the user's language |
| Responsible AI & Ethics | Numbers from code, fixed safety rules, honest about what it doesn't know, never diagnoses, de-identified AI payload, works offline |
| Innovation & Creativity | Breaking dishes into trigger ingredients; diagnosis diary mapped to Rome IV |
| Feasibility | Local-first storage, any OpenAI-compatible model (Tencent Hunyuan by default), clinic recommendation route |

---

## Submission copy (ready to paste)

**Project title:** IBSync

**Short blurb (under 10 words):** Turning your IBS diary into better doctor visits.

**Project description:**

*Overview: scenarios, users, value.* IBS affects an estimated 4–10% of people worldwide (depending on diagnostic criteria) and most often starts between the teens and the 40s, which are the years of exams, first jobs and eating out. Many people live with symptoms for months before seeing a doctor, then arrive at a short consult unable to describe what's been happening. Plenty of IBS apps already exist, but they are mostly food diaries or US-based therapy and care programmes. We didn't find one built around Singapore's food, languages and clinics, or one that handles medicines and appointment preparation together. IBSync connects what happens between visits to what happens in the consult. It serves both people who think they might have IBS (a structured symptom diary for their GP) and people managing a diagnosis (triggers, medicines, check-ups).

*Real-world pain points.*
1. Trigger foods are personal and show up 2–6 hours later, so a 9am kopi rarely gets linked to 11am bloating. Western food apps don't have hawker dishes.
2. Antispasmodics have to be taken *before* meals, and evening doses get missed when people eat out.
3. Clinic visits are short, and patients forget what happened over the last 3 months.
4. Alarm symptoms (blood, weight loss, night-time symptoms) get normalised as "just my IBS".
5. Existing apps feel clinical, use alarming reds, and are English-only.

*Solution design.*
- **Two journeys:** "I think I might have IBS" builds a diary that maps onto the Rome IV symptom criteria, with a GP-ready PDF. IBSync never says "you have IBS", and it warns people not to cut out gluten before a coeliac test. "I've been diagnosed" focuses on triggers, medicines and reviews.
- **Track in under 10 seconds:** meals from a local food catalogue (kopi, laksa, chicken rice…), plus your own dishes tagged by ingredient. Also a pain slider with friendly faces, a non-graphic Bristol stool picker, stress, sleep, water, movement, and a diary.
- **Deterministic analytics engine** (`src/lib/analytics.js`): symptoms in the 45 minutes to 6 hours after each food and ingredient, flare-rate comparisons for stress, sleep, movement and water, the Rome IV stool pattern and diary check, adherence for each dose time with missed-dose reasons, and alarm-feature detection.
- **AI layer** (Tencent Hunyuan through an OpenAI-compatible endpoint): it rephrases the engine's numbers into an at-a-glance overview, a plan for today, insights for each section, doctor questions and a grounded chat, in English, 中文, Bahasa Melayu or தமிழ். The prompts (`src/ai/prompts.js`) only allow claims backed by USER_DATA and explanations from the curated MEDICINE_FACTS.
- **Guardrails** (`src/ai/guardrails.js`): fixed safe responses for emergencies (995), crisis language (SOS 1767), dose changes and unidentifiable medicines. Dosing instructions are removed from model output.
- **Medicines:** your own medicines and dose times, plain-language explanations, adherence for each dose time, the reason behind each miss, and refill countdowns.
- **Care:** your own appointments, tests and check-ups with repeat schedules, suggested preventive items, AI-drafted questions, a red-flag checklist and a one-page clinician PDF.
- **Flare mode:** a dimmed, low-stimulus screen with paced breathing, comfort steps, gentle foods, your own triggers to skip, and when to seek urgent care.

*Business value.*
- **For patients:** better-prepared visits, because the PDF summarises 28 days into a 2-minute read. Adherence becomes measurable for each dose time, with the barrier behind each miss. Alarm features get escalated earlier.
- **Route to market:** B2B2C through polyclinics and Healthier SG family doctors, who recommend the app while patients bring the summary.
- **Extends to:** other chronic GI conditions (IBD, GERD).
- **Example pilot targets:** +15 percentage points of evening-dose adherence, fewer self-reported flare days after 8 weeks, and at least 80% of patients bringing a summary to follow-up.

---

## Who it's for

- **People diagnosed with IBS:** find personal triggers, keep medicines on track, prepare for reviews.
- **People who think they might have IBS:** build a structured symptom diary that maps onto the Rome IV symptom criteria GPs use (pain frequency, link to bowel movements, change in stool frequency and form), with a GP-ready PDF. IBSync never says "you have IBS". It shows what the diary contains and encourages a GP visit, plus tests such as a coeliac screen before anyone cuts out gluten.

People choose their situation on first launch and can change it any time in Settings.

## Make it yours

- **Your own foods:** add any dish in the meal logger and tag what's in it (dairy, garlic/onion, wheat…), so the trigger engine can still work out which ingredient is behind it.
- **Your own medicines and schedules:** set any number of dose times, or mark a medicine "as needed", and track doses left. Recognised medicines get a plain-language explanation; unrecognised ones still get reminders, with an honest "ask your pharmacist".
- **Your own appointments, tests and check-ups:** set a date, time and place, and choose whether it repeats (3, 6 or 12 months). "Done" rolls a repeating item forward. Suggested check-ups can be added in one tap.

## Run it

```bash
npm install
cp .env.example .env      # optional: add AI_API_KEY for live Hunyuan
npm run dev               # http://localhost:5173
```

Production (e.g. Tencent Cloud Lighthouse / CVM / CloudBase Run):

```bash
npm run build
AI_API_KEY=... PORT=8080 npm start
```

**There's no AI key? It still works.** Every AI surface has an on-device fallback (`src/ai/localEngine.js`) that builds the same outputs from the analytics numbers, so the demo can't break on stage. Each AI text shows its source ("AI · hunyuan-turbos-latest", "On-device insight" or "Safety response").

The app ships with 4 weeks of realistic demo data that has discoverable patterns: dairy, garlic/onion and coconut meals → symptoms; an exam-stress week → flares and loose stools; walking days → fewer flares; missed evening doses when eating out. Settings → Reset demo data restores it.

---

## Architecture

```mermaid
flowchart LR
  subgraph Device["📱 Patient device (trusted)"]
    UI[React UI<br/>Today · Log · Insights · Meds · Ask · Care · Flare mode]
    Store[(localStorage<br/>raw logs, diary, profile)]
    AN[Analytics engine<br/>food windows · flare rates · Rome IV · adherence · red flags]
    LE[On-device insight engine<br/>fallback]
    G1[Pre-guardrails<br/>emergency · crisis · dose change · unknown med]
    G2[Post-guardrail<br/>strip dosing]
    KB[(Curated medicine facts)]
    UI <--> Store
    Store --> AN --> UI
    AN --> LE --> UI
    UI --> G1
  end
  subgraph Server["🔐 IBSync proxy (Tencent Cloud)"]
    P[/api/ai<br/>holds API key · size limits · timeout/]
  end
  subgraph Tencent["☁️ Tencent Hunyuan"]
    LLM[hunyuan-turbos-latest<br/>OpenAI-compatible API]
  end
  G1 -- "de-identified summary only<br/>(numbers, food names, 1 diary line)" --> P --> LLM
  KB --> G1
  LLM --> P --> G2 --> UI
```

### Trust boundaries

| Boundary | What crosses it | What never crosses it |
|---|---|---|
| Device → proxy | `compactForLLM()` output: 7-day numbers, food names, rates, latest diary line, medicine labels | Name, raw event log, full diary, timestamps beyond day labels |
| Proxy → Hunyuan | Same payload + system prompt; the key is added server-side | Browser never sees the API key |
| Model → user | Text passes the post-filter (dose instructions removed) and is shown with its source label | Model output never changes data, medicines or reminders |

### Key design trade-offs

1. **Numbers come from code; words come from AI.** Correlations are computed deterministically, so they're auditable and reproducible, and the LLM only explains them. This rules out hallucinated statistics, at the cost of fewer "creative" insights.
2. **Rules before the model for safety-critical routes.** Emergencies and dose changes never reach the LLM. The latency is zero and the behaviour is guaranteed, but the phrasing is less flexible.
3. **Closed medicine knowledge.** The assistant can explain only medicines in the curated KB and abstains otherwise ("I'm not able to identify that medication…"). That makes coverage narrower but safe.
4. **Local-first storage.** Health logs stay on the device (PDPA-friendly, nothing to breach). The trade-off is no cross-device sync yet; a production version would add encrypted sync on Tencent Cloud.
5. **Association, not causation.** The 45–360 min post-meal window and a minimum of 3 meals before a verdict reduce false triggers, and users can override any food verdict.

---

## Challenge requirements → features

| Requirement | Where |
|---|---|
| Medication understanding | Meds → "Understand your medicines", lookup, Ask chat (KB-grounded, abstains on unknown) |
| Medication management | Today/Meds dose list, as-needed logging, refill countdown |
| Adherence support | Adherence ring + per-slot %, "What got in the way?" barrier capture + tailored tips |
| Health tracking | Log (meal, symptoms, Bristol, water, movement, stress, sleep, diary), Insights tabs, Timeline |
| Preventive health | Care → check-ups & prevention, red-flag checklist, plan for today |
| Healthcare preparation | Care → AI questions, concerns list, "Ask my doctor this" from chat, clinician PDF |
| Safe / strictly bounded / honest about uncertainty | Guardrails, fixed safety responses, source labels, "still learning" verdicts |
| Personalised & longitudinal | All insights from the user's own 28-day history; week-over-week comparisons |
| Accessible (teens–40s, all backgrounds) | 4 languages, 3 text sizes, simpler-wording mode, reduce motion, shape+colour status (never colour alone), 44px+ targets, gender-neutral design |

---

## Design system

The look follows the team's mockup: deep teal on a barely-cream eggshell background, white cards with soft shadows, tinted icon tiles, and pill tabs. Four details give IBSync its own identity:

- **Flare-risk ring:** the Today ring fills up the more settled your last 7 days were, and its colour shifts with the risk level. The score is explainable (tap "How is this worked out?").
- **Pebbles:** days appear as soft stones. Status is shown by shape as well as colour (● calm, ■ mild, ▲ flare), never by colour alone.
- **Visit pass:** the Care page leads with a ticket-style card for your next appointment. The top half shows when and where, the bottom half what to bring, and it opens an in-app summary you can show the doctor.
- **Section colours:** in Insights, Overview is teal, Foods coral, Stool amber, Symptoms brick and Lifestyle lavender, so you always know where you are.

**Type:** headings in Bricolage Grotesque and body text in Figtree, with Noto Sans SC and Noto Sans Tamil fallbacks for 中文 and தமிழ். All fonts are self-hosted, so the app works offline.

**Themes** (Settings → Colour theme): Teal (default), Oat & Moss, Sage Clinic, Clay, and Espresso (dark mode, which also powers Flare mode). Severity always runs from teal through amber to brick, never alarm red.

## Data sources & references

- Trigger patterns modelled on the Monash University low-FODMAP framework and IBS literature on lactose and FODMAP sensitivity and the gut–brain axis.
- Stool subtype: Rome IV criteria (share of Bristol types 1–2 vs 6–7).
- Alarm features: Rome IV / NICE CG61 red flags.
- For model validation at scale, open datasets such as MIMIC-III (PhysioNet) or Kaggle IBS/food-symptom datasets can be used to calibrate trigger windows.

## Competitor sources

- Lin Health, "Best Apps For IBS In 2026": https://www.lin.health/insights/best-apps-ibs
- Mindset Health (Nerva), "Compare IBS apps and programs": https://start.nervahealth.com/compare/ibs-apps

Both pages are published by companies that make IBS apps, so we treated them as starting points, not neutral rankings.

## Built with

React 19, Vite, Tailwind CSS v4, Recharts, date-fns, jsPDF, lucide-react · Tencent Hunyuan (OpenAI-compatible API) · developed with **Tencent CodeBuddy** (see `/docs` for conversation-log screenshots).

## Development process

IBSync was built for the Tencent Cloud × AI Singapore "AI CAN DO IT" Hackathon 2026. The entire codebase — from the React UI through the analytics engine, AI layer, and tests — was written in **Tencent CodeBuddy**, an AI pair-programming IDE. The team described what each piece should do in natural language; CodeBuddy generated the implementation, and the team reviewed, refined, and tested every change.

### How the project is organised

| Layer | Folder(s) | What lives there |
|---|---|---|
| UI screens | `src/pages/` (9 `.jsx`) | Today, Log, Insights, Meds, Ask, Care, FlareMode, Timeline, Settings |
| UI building blocks | `src/components/` (5 `.jsx`) | `Layout`, `ui` (buttons, cards, pills), `charts` (Recharts wrappers), `art` (pebbles, icons), `Welcome` onboarding |
| Analytics engine | `src/lib/analytics.js` | Deterministic food-symptom scoring, Rome IV checks, adherence, red flags, gut-weather, context builder |
| Other lib | `src/lib/doses.js`, `src/lib/report.js` | Dose scheduling, GP PDF generation (jsPDF) |
| AI layer | `src/ai/` | `prompts.js` (system prompts with grounding rules), `guardrails.js` (pre/post safety filters), `client.js` (proxy caller with fallback), `localEngine.js` (on-device insight fallback) |
| Data | `src/data/` | `foods.js` (Singapore food catalogue + trigger tags), `meds.js` (curated medicine KB), `seed.js` (4 weeks of demo data) |
| Server | `server/` | `aiHandler.js` (AI proxy middleware, holds API key), `index.js` (production static + proxy server) |
| Tests | `test/analytics.test.js` | 13 tests for `foodScores` and `romeCheck` on sample data |
| Config | `vite.config.js`, `vercel.json`, `package.json` | Vite + Tailwind + React plugins, AI proxy dev middleware, SPA rewrites, npm scripts |

### Tools and what they were used for

| Tool | Role in the project |
|---|---|
| **Tencent CodeBuddy** | AI pair-programming IDE used to write, review, and refactor the entire codebase. Conversation-log screenshots are in `/docs`. |
| **React 19 + Vite 8** | SPA framework and build/dev server. Vite's middleware hook (`vite.config.js`) also mounts the AI proxy in dev and preview mode so the API key never reaches the browser. |
| **Tailwind CSS v4** | All styling via utility classes and the `@tailwindcss/vite` plugin. Five colour themes (Teal, Oat & Moss, Sage Clinic, Clay, Espresso) plus the Flare-mode dark theme. |
| **Recharts** | Charts in Insights (symptom trends, stool distribution, lifestyle effects). |
| **date-fns v4** | All date arithmetic in the analytics engine (day keys, 28-day windows, minute-difference for post-meal symptom windows, Rome IV time-since logic). |
| **jsPDF** | Generates the one-page GP visit summary PDF from analytics context (`src/lib/report.js`). |
| **lucide-react** | Icon set used throughout the UI. |
| **@fontsource-variable** | Self-hosted fonts: Bricolage Grotesque (headings), Figtree (body), Nunito (alt), plus Noto Sans SC and Noto Sans Tamil for 中文 and தமிழ். Self-hosting keeps the app offline-capable. |
| **Tencent Hunyuan** | The LLM behind the AI layer (model `hunyuan-turbos-latest`, called through an OpenAI-compatible API). The proxy in `server/aiHandler.js` injects the key server-side; the browser only calls `/api/ai`. |
| **Node built-in `assert`** | The test script (`test/analytics.test.js`) uses Node's native `assert/strict` and runs with `npm test` — no external test runner. |

### Key design decisions made during development

1. **Numbers from code, words from AI.** The analytics engine (`src/lib/analytics.js`) computes every correlation, score, and verdict deterministically. The LLM only rephrases those numbers — it can't invent statistics. This was a deliberate safety-first choice made early in the build.
2. **Rules before the model.** Safety-critical paths (emergencies, crisis language, dose changes, unknown medicines) are intercepted by fixed guardrails in `src/ai/guardrails.js` before anything reaches the LLM, guaranteeing zero latency and fixed responses.
3. **On-device fallback from day one.** `src/ai/localEngine.js` produces the same output shapes as the LLM, so the app works fully offline — essential for a hackathon demo that can't break on stage.
4. **Local-first storage.** All health logs stay in the browser's `localStorage` (PDPA-friendly, nothing to breach). The trade-off is no cross-device sync yet.
5. **Singapore-first data.** The food catalogue and medicine KB were hand-curated for local context — hawker dishes broken into trigger ingredients, Singlish/Chinese phrasing in guardrails, four official languages in the UI.

### npm scripts

| Script | What it does |
|---|---|
| `npm run dev` | Start Vite dev server on `:5173` with the AI proxy middleware attached |
| `npm run build` | Production build to `dist/` |
| `npm start` | Serve the built app + AI proxy on `:8080` (Node, no framework) |
| `npm run preview` | Vite preview server (also has the AI proxy) |
| `npm run lint` | Lint with oxlint |
| `npm test` | Run analytics tests (`test/analytics.test.js`) |

> IBSync explains and organises. It does not diagnose or change treatment.
