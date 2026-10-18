# No-Billing Demo Mode & Local Storage Architecture

A resilient, zero-cost operational mode for AURA that runs completely in the browser and development environment without requiring a paid Google Cloud billing account or custom Firestore database provisioning, while preserving existing Firebase code, UI aesthetics, and clinical features.

## User Review & Critical Decisions

> [!IMPORTANT]
> This plan ensures AURA can be demonstrated, tested, and deployed immediately with zero cloud billing dependencies while preserving existing Firebase code intact for future cloud deployment.

- **Storage Strategy for Demo Mode**: Use browser `localStorage` with isolated namespaces (`aura_demo_v1_*` for Eleanor Vance demo state, and `aura_sandbox_v1_*` for user-entered patient records). Real authenticated records remain strictly partitioned.
- **Firebase Connection Safeguard**: Guard the auto-executing Firestore `testConnection()` call so it only runs if cloud persistence is explicitly enabled and configured, preventing unhandled client offline/billing errors during boot.
- **Gemini AI Extraction & Synthesis**: Keep the existing deterministic algorithms (`parsePrescriptionText` and structured pattern templates) active as instant fallbacks when no API key or paid quota is present.

---

## 1. Overview & Core Concept

- **What It Does**: Enables AURA to boot, navigate, extract documents, run longitudinal pattern detection, save clinician reviews, and simulate multi-provider wearable syncing completely within a free, no-billing environment.
- **Target Audience / Persona**: Prospective evaluators, clinicians reviewing the interface, patients testing document ingestion, and developers deploying on free-tier preview environments.
- **Key Value**: 100% operational fidelity—including full record creation, prescription intake, and longitudinal trend analysis—without credit card, billing setup, or cloud database provisioning failures.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Application Boot**: App loads instantly in **No-Billing Demo Mode** by default, loading Eleanor Vance's longitudinal timeline from seed data or existing local edits.
  2. **Patient / Demo Switcher**: Users can seamlessly toggle between Eleanor Vance's curated case study and an isolated "Sandbox Patient" (empty onboarding state) without logging into Google.
  3. **Adding Records & Prescriptions**: Users can upload lab reports or type prescription notes. The app runs extraction (via server-side Gemini if key is present, or instant deterministic clinical parsing if unconfigured), and saves the records directly to browser `localStorage`.
  4. **Clinician Reviews & Feedback**: Clinicians can disposition patterns (e.g. marked as reviewed or requiring follow-up) with notes, persisting immediately to local storage.
  5. **Explicit Cloud Upgrade / Sign-In**: If the user desires multi-device Google Sync, clicking "Sign In with Google" explains that Cloud Firestore sync is optional, keeping local data safe and separate.

- **Visual Identity & Theme**:
  - Retain AURA's dignified clinical aesthetic: warm paper palette (`#FBF9F5` background, `#1E3A2F` deep forest green accents, `#FAF7F0` cards, `#E7E2D8` borders).
  - Editorial serif typography (`Lora`) paired with `Plus Jakarta Sans` and monospace `JetBrains Mono` for clinical metrics.
  - A subtle, discreet indicator badge in the navigation bar/profile indicating "Local Storage / Demo Mode (No Billing Required)" with a tooltip explaining that data is private and saved locally in the browser.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Storage Architecture — `localStorage` with Strict Partition Keys**
  - *Chosen Approach*: Implement a structured local persistence layer with separate keys for demo records (`aura_demo_records`), sandbox records (`aura_sandbox_records`), and reviews (`aura_sandbox_reviews`).
  - *Why*: Provides instant persistence across browser refreshes with zero latency, zero network roundtrips, and zero billing liability.
  - *Alternatives Considered*: IndexedDB (added complexity without immediate benefit for lightweight clinical records) or pure in-memory state (loses user additions on page refresh).

- **Decision 2: Defensive Firebase Initialization**
  - *Chosen Approach*: Keep existing Firebase SDK and Firestore types intact, but introduce a runtime guard in `src/firebase.ts` and `HealthContext.tsx` that skips Firestore calls unless explicit user authentication and valid database access are confirmed.
  - *Why*: Avoids ripping out existing Firebase infrastructure while preventing Firestore from throwing errors or stalling boot due to the unbilled named database (`ai-studio-7130c56d-...`).

- **Decision 3: Dual-Mode Gemini AI Extraction**
  - *Chosen Approach*: Maintain the hybrid architecture in `server/api.ts` where Gemini `gemini-3.8-flash` is queried if `GEMINI_API_KEY` is present, but seamlessly returns the high-fidelity deterministic regex extraction and PubMed/FDA baselines if the key is missing or quota is exceeded.
  - *Why*: Zero breaking changes for users without API keys while providing AI acceleration when available.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        AURA Client Application                         │
│  ┌───────────────────────┐  ┌───────────────────┐  ┌────────────────┐  │
│  │    HealthStoryView    │  │    RecordsView    │  │   TrendsView   │  │
│  └───────────┬───────────┘  └─────────┬─────────┘  └────────┬───────┘  │
│              └────────────────┐       │       ┌─────────────┘          │
│                               ▼       ▼       ▼                        │
│                     ┌───────────────────────────────────┐              │
│                     │       HealthContext Provider      │              │
│                     │  • Mode: Demo | Sandbox | Cloud   │              │
│                     │  • Pattern Detection Engine       │              │
│                     └───────┬───────────────────┬───────┘              │
└─────────────────────────────┼───────────────────┼──────────────────────┘
                              │                   │                       
      (Local Mode: Default)   │                   │  (Cloud Mode: Optional)
                              ▼                   ▼                       
    ┌───────────────────────────────┐   ┌───────────────────────────────┐ 
    │      Browser localStorage     │   │      Firebase Firestore       │ 
    │  • aura_demo_records          │   │  • users/{uid}/records        │ 
    │  • aura_sandbox_records       │   │  • users/{uid}/observations   │ 
    │  • aura_sandbox_reviews       │   │  • users/{uid}/reviews        │ 
    └───────────────────────────────┘   └───────────────────────────────┘ 
                              │                                           
                              ▼                                           
                ┌───────────────────────────┐                             
                │   Express Backend Proxy   │                             
                │  • /api/extract (Gemini)  │                             
                │  • /api/explain           │                             
                │  • /api/science/*         │                             
                └───────────────────────────┘                             
```

### Data Model & State Mapping
- **Demo Mode (`demo`)**: Eleanor Vance's 2025-2026 statin myalgia timeline. Edits or newly added documents are saved to `aura_demo_records_v1`. A "Reset Demo" button allows reverting to pristine seed data at any time.
- **Sandbox Patient Mode (`sandbox`)**: Unassigned new patient. Uploaded medical records, lab reports, and extracted observations persist to `aura_sandbox_records_v1`. When at least 2 records exist, the pattern engine computes temporal associations locally.
- **Authenticated Cloud Mode (`authenticated`)**: Activated only when the user explicitly triggers Google Sign-In and confirms cloud synchronization.
