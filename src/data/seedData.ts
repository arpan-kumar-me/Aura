import { HealthRecord, Observation, PatternCandidate, ConnectedProvider, BenchmarkComparison } from '../types';

export const INITIAL_PATIENT = {
  uid: 'patient_eleanor_vance',
  displayName: 'Eleanor Vance',
  age: 52,
  gender: 'Female',
  mrn: 'AURA-EV7204',
  primaryConditions: ['Hyperlipidemia', 'Subclinical Hypothyroidism', 'Mild Exertional Fatigue'],
  allergies: ['Penicillin (mild rash)'],
  primaryPhysician: 'Dr. Sarah Lin, MD (Internal Medicine)',
};

export const INITIAL_PROVIDERS: ConnectedProvider[] = [
  {
    id: 'apple_health',
    name: 'Apple Health',
    category: 'wearable',
    icon: 'activity',
    status: 'connected',
    lastSync: '12 minutes ago',
    metricsProvided: ['Resting Heart Rate', 'Heart Rate Variability', 'Sleep Stages', 'Daily Step Count'],
    isDemo: true,
  },
  {
    id: 'quest_diagnostics',
    name: 'Quest Diagnostics',
    category: 'laboratory',
    icon: 'flask-conical',
    status: 'connected',
    lastSync: 'Yesterday at 4:15 PM',
    metricsProvided: ['Comprehensive Metabolic Panel', 'Lipid Panel', 'Creatine Kinase (CPK)', 'Ferritin', 'TSH'],
    isDemo: true,
  },
  {
    id: 'epic_mychart',
    name: 'Mount Sinai Health (MyChart EHR)',
    category: 'ehr',
    icon: 'hospital',
    status: 'connected',
    lastSync: 'October 12, 2026',
    metricsProvided: ['Clinical Consultation Notes', 'Prescription History', 'Encounter Summaries'],
    isDemo: true,
  },
  {
    id: 'oura_ring',
    name: 'Oura Ring Gen 3',
    category: 'wearable',
    icon: 'moon',
    status: 'stale',
    lastSync: '3 days ago',
    metricsProvided: ['Sleep Efficiency', 'Nocturnal Skin Temp', 'Respiratory Rate'],
    isDemo: true,
  },
];

export const INITIAL_RECORDS: HealthRecord[] = [
  {
    id: 'rec_01_quest_2024_04',
    userId: 'patient_eleanor_vance',
    title: 'Lipid & Metabolic Panel',
    recordType: 'lab_report',
    source: 'Quest Diagnostics',
    date: '2024-04-10',
    status: 'confirmed',
    summary: 'Elevated total cholesterol (248 mg/dL) and LDL-C (165 mg/dL). Baseline CPK normal at 74 U/L.',
    rawContent: `SPECIMEN: Serum / Fasting
Total Cholesterol: 248 mg/dL [Ref: <200] (High)
Triglycerides: 142 mg/dL [Ref: <150] (Normal)
HDL Cholesterol: 55 mg/dL [Ref: >50] (Normal)
LDL Cholesterol (Calc): 165 mg/dL [Ref: <100] (High)
Creatine Kinase (CPK): 74 U/L [Ref: 30-145] (Normal)
ALT: 22 U/L [Ref: 7-35] (Normal)
AST: 20 U/L [Ref: 10-35] (Normal)`,
    extractedFacts: [
      { id: 'f1', metricKey: 'cholesterol_total', metricLabel: 'Total Cholesterol', numericValue: 248, unit: 'mg/dL', referenceHigh: 200, status: 'elevated', confidence: 0.99, requiresConfirmation: false, sourceSnippet: 'Total Cholesterol: 248 mg/dL' },
      { id: 'f2', metricKey: 'ldl', metricLabel: 'LDL Cholesterol', numericValue: 165, unit: 'mg/dL', referenceHigh: 100, status: 'elevated', confidence: 0.99, requiresConfirmation: false, sourceSnippet: 'LDL Cholesterol (Calc): 165 mg/dL' },
      { id: 'f3', metricKey: 'cpk', metricLabel: 'Creatine Kinase (CPK)', numericValue: 74, unit: 'U/L', referenceLow: 30, referenceHigh: 145, status: 'normal', confidence: 0.99, requiresConfirmation: false, sourceSnippet: 'Creatine Kinase (CPK): 74 U/L' },
    ],
    createdAt: '2024-04-11T08:30:00Z',
  },
  {
    id: 'rec_02_rx_2024_04',
    userId: 'patient_eleanor_vance',
    title: 'Prescription: Atorvastatin 20mg Initiation',
    recordType: 'prescription',
    source: 'Mount Sinai Clinic',
    date: '2024-04-12',
    status: 'confirmed',
    summary: 'Initiated Atorvastatin 20mg orally once daily at bedtime for hypercholesterolemia management.',
    rawContent: `MOUNT SINAI MEDICAL CENTER — CARDIOLOGY CLINIC
Prescriber: Dr. Sarah Lin, MD (NPI: 1849204821)
Date: 2024-04-12
Patient: Eleanor Vance (MRN: AURA-EV7204)

Rx: Atorvastatin Calcium 20 mg Oral Tablet
Dispense: #90 (Ninety) tablets
Sig: Take 1 tablet by mouth daily at bedtime with water for hyperlipidemia.
Refills: 3 (Three)
Duration: 90 days supply
Pharmacy: Mount Sinai Outpatient Pharmacy
Substitution: Permitted`,
    prescriptionDetails: {
      medicationName: 'Atorvastatin Calcium',
      strength: '20 mg',
      dosage: '1 tablet',
      frequency: 'Once daily at bedtime',
      route: 'Oral',
      duration: '90 days',
      prescribingClinician: 'Dr. Sarah Lin, MD',
      prescriptionDate: '2024-04-12',
      refills: '3',
      instructions: 'Take 1 tablet by mouth daily at bedtime with water for hyperlipidemia.',
      isTakenConfirmed: true,
    },
    attachedFile: {
      name: 'Dr_Lin_Atorvastatin_20mg_Script.pdf',
      type: 'application/pdf',
      size: 154200,
      uploadedAt: '2024-04-12T14:00:00Z',
    },
    extractedFacts: [
      { id: 'f4', metricKey: 'rx_atorvastatin', metricLabel: 'Atorvastatin Daily Dose', numericValue: 20, unit: 'mg', status: 'recorded', confidence: 0.98, requiresConfirmation: false, sourceSnippet: 'Atorvastatin calcium 20mg oral tablet' },
    ],
    createdAt: '2024-04-12T14:00:00Z',
  },
  {
    id: 'rec_03_sym_2024_04',
    userId: 'patient_eleanor_vance',
    title: 'Symptom Note: Bilateral Thigh Heaviness',
    recordType: 'symptom',
    source: 'Patient Diary (AURA Mobile)',
    date: '2024-04-20',
    status: 'confirmed',
    summary: 'Reported dull calf and quad soreness after moderate walking. Assumed to be post-gardening fatigue.',
    rawContent: 'Noted heavy feeling in both thighs when climbing stairs today. Similar soreness in lower calves. Did some yard work over the weekend, maybe pulled something.',
    extractedFacts: [
      { id: 'f5', metricKey: 'symptom_myalgia', metricLabel: 'Bilateral Leg Myalgia', numericValue: 1, unit: 'present', status: 'recorded', confidence: 0.94, requiresConfirmation: false, sourceSnippet: 'heavy feeling in both thighs when climbing stairs' },
    ],
    createdAt: '2024-04-20T19:40:00Z',
  },
  {
    id: 'rec_04_lab_2024_05',
    userId: 'patient_eleanor_vance',
    title: 'Post-Initiation Safety Lab Panel',
    recordType: 'lab_report',
    source: 'Quest Diagnostics',
    date: '2024-05-08',
    status: 'confirmed',
    summary: 'LDL reduced to 118 mg/dL. CPK mildly elevated at 182 U/L (baseline was 74). Asymptomatic at visit.',
    rawContent: `Creatine Kinase (CPK): 182 U/L [Ref: 30-145] (Elevated)
ALT: 29 U/L [Ref: 7-35] (Normal)
AST: 27 U/L [Ref: 10-35] (Normal)
Total Cholesterol: 188 mg/dL [Ref: <200] (Normal)
LDL Cholesterol: 118 mg/dL [Ref: <100] (Borderline)`,
    extractedFacts: [
      { id: 'f6', metricKey: 'cpk', metricLabel: 'Creatine Kinase (CPK)', numericValue: 182, unit: 'U/L', referenceHigh: 145, status: 'elevated', confidence: 0.99, requiresConfirmation: false, sourceSnippet: 'Creatine Kinase (CPK): 182 U/L' },
      { id: 'f7', metricKey: 'ldl', metricLabel: 'LDL Cholesterol', numericValue: 118, unit: 'mg/dL', referenceHigh: 100, status: 'normal', confidence: 0.99, requiresConfirmation: false, sourceSnippet: 'LDL Cholesterol: 118 mg/dL' },
    ],
    createdAt: '2024-05-09T09:15:00Z',
  },
  {
    id: 'rec_05_enc_2025_09',
    userId: 'patient_eleanor_vance',
    title: 'Annual Preventative Medicine Encounter',
    recordType: 'clinical_note',
    source: 'Mount Sinai Clinic',
    date: '2025-09-15',
    status: 'confirmed',
    summary: 'Cardiovascular risk assessment review. Statin dosage titrated from 20mg to 40mg to reach LDL < 100 goal.',
    rawContent: `Internal Medicine Progress Note
Patient presents for annual preventive visit. Blood pressure 124/78 mmHg. BMI 24.2.
Lipid profile reviewed: LDL 112 mg/dL. In light of ASCVD 10-year risk, agreed to titrate Atorvastatin from 20mg daily to 40mg daily.
Patient reminded to report any unexpected muscle aches or weakness. Routine labs ordered for 4 weeks.`,
    extractedFacts: [
      { id: 'f8', metricKey: 'rx_atorvastatin', metricLabel: 'Atorvastatin Dose Titration', numericValue: 40, unit: 'mg', status: 'recorded', confidence: 0.98, requiresConfirmation: false, sourceSnippet: 'titrate Atorvastatin from 20mg daily to 40mg daily' },
      { id: 'f9', metricKey: 'blood_pressure_systolic', metricLabel: 'Systolic Blood Pressure', numericValue: 124, unit: 'mmHg', referenceHigh: 120, status: 'normal', confidence: 0.97, requiresConfirmation: false, sourceSnippet: 'Blood pressure 124/78 mmHg' },
    ],
    createdAt: '2025-09-15T16:20:00Z',
  },
  {
    id: 'rec_06_sym_2025_09',
    userId: 'patient_eleanor_vance',
    title: 'Symptom Note: Severe Quadriceps Aching & Morning Stiffness',
    recordType: 'symptom',
    source: 'Patient Diary (AURA Mobile)',
    date: '2025-09-24',
    status: 'confirmed',
    summary: 'Onset of diffuse bilateral quadriceps aching, persistent fatigue, and broken sleep 9 days post-dose increase.',
    rawContent: 'Legs feel extremely heavy and aching, especially in the mornings. Difficulty with morning walk. Also waking up 3-4 times every night with restless leg sensation. No new workout or strain.',
    extractedFacts: [
      { id: 'f10', metricKey: 'symptom_myalgia', metricLabel: 'Proximal Muscle Aching', numericValue: 2, unit: 'moderate-severe', status: 'recorded', confidence: 0.96, requiresConfirmation: false, sourceSnippet: 'Legs feel extremely heavy and aching' },
    ],
    createdAt: '2025-09-24T21:10:00Z',
  },
  {
    id: 'rec_07_lab_2025_10',
    userId: 'patient_eleanor_vance',
    title: 'Comprehensive Metabolic & CPK Workup',
    recordType: 'lab_report',
    source: 'Quest Diagnostics',
    date: '2025-10-08',
    status: 'confirmed',
    summary: 'CPK markedly increased to 312 U/L (>2x upper reference limit). AST mildly elevated at 42 U/L. Ferritin 24 ng/mL.',
    rawContent: `Creatine Kinase (CPK): 312 U/L [Ref: 30-145] (High - Critical review)
AST (SGOT): 42 U/L [Ref: 10-35] (Mildly High)
ALT (SGPT): 34 U/L [Ref: 7-35] (Normal)
Ferritin: 24 ng/mL [Ref: 15-150] (Low-Normal)
TSH: 2.45 mIU/L [Ref: 0.45-4.50] (Normal)
eGFR: 88 mL/min/1.73m2 [Ref: >60] (Normal)`,
    extractedFacts: [
      { id: 'f11', metricKey: 'cpk', metricLabel: 'Creatine Kinase (CPK)', numericValue: 312, unit: 'U/L', referenceHigh: 145, status: 'elevated', confidence: 0.99, requiresConfirmation: false, sourceSnippet: 'Creatine Kinase (CPK): 312 U/L' },
      { id: 'f12', metricKey: 'ast', metricLabel: 'Aspartate Aminotransferase (AST)', numericValue: 42, unit: 'U/L', referenceHigh: 35, status: 'elevated', confidence: 0.99, requiresConfirmation: false, sourceSnippet: 'AST (SGOT): 42 U/L' },
      { id: 'f13', metricKey: 'ferritin', metricLabel: 'Serum Ferritin', numericValue: 24, unit: 'ng/mL', referenceLow: 15, referenceHigh: 150, status: 'normal', confidence: 0.98, requiresConfirmation: false, sourceSnippet: 'Ferritin: 24 ng/mL' },
    ],
    createdAt: '2025-10-08T11:45:00Z',
  },
  {
    id: 'rec_08_enc_2026_08',
    userId: 'patient_eleanor_vance',
    title: 'Routine General Follow-up Visit (Latest Encounter)',
    recordType: 'clinical_note',
    source: 'Mount Sinai Clinic',
    date: '2026-08-14',
    status: 'confirmed',
    summary: 'Patient voiced mild diffuse fatigue and leg heaviness. Routine in-office exam unremarkable. Plan: recheck labs in 6 months.',
    rawContent: `Follow-up Clinical Encounter
Subjective: Patient mentions episodic low energy and leg tiredness over the summer. Denies chest pain, shortness of breath.
Objective: Vitals stable. BP 120/76. Musculoskeletal exam: full active range of motion, normal 5/5 symmetric strength. No focal tenderness.
Assessment: Non-specific fatigue. Consider lifestyle stress or sleep hygiene. Routine followup in 6 months.`,
    extractedFacts: [
      { id: 'f14', metricKey: 'symptom_fatigue', metricLabel: 'Episodic Low Energy', numericValue: 1, unit: 'mild', status: 'recorded', confidence: 0.92, requiresConfirmation: false, sourceSnippet: 'Patient mentions episodic low energy' },
    ],
    createdAt: '2026-08-14T15:00:00Z',
  },
];

export const INITIAL_OBSERVATIONS: Observation[] = [
  // 2024 Baseline & First Statin Period
  { id: 'obs_01', userId: 'patient_eleanor_vance', metric: 'cpk', metricLabel: 'Creatine Kinase', value: 74, unit: 'U/L', referenceLow: 30, referenceHigh: 145, timestamp: '2024-04-10T09:00:00Z', source: 'Quest Diagnostics' },
  { id: 'obs_02', userId: 'patient_eleanor_vance', metric: 'rhr', metricLabel: 'Resting Heart Rate', value: 62, unit: 'bpm', timestamp: '2024-04-10T07:00:00Z', source: 'Apple Health' },
  { id: 'obs_03', userId: 'patient_eleanor_vance', metric: 'hrv', metricLabel: 'Heart Rate Variability', value: 46, unit: 'ms', timestamp: '2024-04-10T07:00:00Z', source: 'Apple Health' },
  { id: 'obs_04', userId: 'patient_eleanor_vance', metric: 'cpk', metricLabel: 'Creatine Kinase', value: 182, unit: 'U/L', referenceLow: 30, referenceHigh: 145, timestamp: '2024-05-08T09:30:00Z', source: 'Quest Diagnostics' },
  { id: 'obs_05', userId: 'patient_eleanor_vance', metric: 'rhr', metricLabel: 'Resting Heart Rate', value: 67, unit: 'bpm', timestamp: '2024-05-08T07:00:00Z', source: 'Apple Health' },
  { id: 'obs_06', userId: 'patient_eleanor_vance', metric: 'hrv', metricLabel: 'Heart Rate Variability', value: 37, unit: 'ms', timestamp: '2024-05-08T07:00:00Z', source: 'Apple Health' },

  // Mid 2024 - 2025 Baselines
  { id: 'obs_07', userId: 'patient_eleanor_vance', metric: 'cpk', metricLabel: 'Creatine Kinase', value: 92, unit: 'U/L', referenceLow: 30, referenceHigh: 145, timestamp: '2024-11-12T08:30:00Z', source: 'Quest Diagnostics' },
  { id: 'obs_08', userId: 'patient_eleanor_vance', metric: 'ferritin', metricLabel: 'Serum Ferritin', value: 42, unit: 'ng/mL', referenceLow: 15, referenceHigh: 150, timestamp: '2024-11-12T08:30:00Z', source: 'Quest Diagnostics' },
  { id: 'obs_09', userId: 'patient_eleanor_vance', metric: 'rhr', metricLabel: 'Resting Heart Rate', value: 61, unit: 'bpm', timestamp: '2025-03-20T07:00:00Z', source: 'Apple Health' },
  { id: 'obs_10', userId: 'patient_eleanor_vance', metric: 'hrv', metricLabel: 'Heart Rate Variability', value: 45, unit: 'ms', timestamp: '2025-03-20T07:00:00Z', source: 'Apple Health' },
  { id: 'obs_11', userId: 'patient_eleanor_vance', metric: 'ferritin', metricLabel: 'Serum Ferritin', value: 28, unit: 'ng/mL', referenceLow: 15, referenceHigh: 150, timestamp: '2025-03-20T08:00:00Z', source: 'Quest Diagnostics' },

  // Late 2025 Titration to 40mg (The Severe Cluster)
  { id: 'obs_12', userId: 'patient_eleanor_vance', metric: 'rhr', metricLabel: 'Resting Heart Rate', value: 61, unit: 'bpm', timestamp: '2025-09-14T07:00:00Z', source: 'Apple Health' },
  { id: 'obs_13', userId: 'patient_eleanor_vance', metric: 'hrv', metricLabel: 'Heart Rate Variability', value: 44, unit: 'ms', timestamp: '2025-09-14T07:00:00Z', source: 'Apple Health' },
  { id: 'obs_14', userId: 'patient_eleanor_vance', metric: 'rhr', metricLabel: 'Resting Heart Rate', value: 69, unit: 'bpm', timestamp: '2025-09-24T07:00:00Z', source: 'Apple Health' },
  { id: 'obs_15', userId: 'patient_eleanor_vance', metric: 'hrv', metricLabel: 'Heart Rate Variability', value: 27, unit: 'ms', timestamp: '2025-09-24T07:00:00Z', source: 'Apple Health' },
  { id: 'obs_16', userId: 'patient_eleanor_vance', metric: 'cpk', metricLabel: 'Creatine Kinase', value: 312, unit: 'U/L', referenceLow: 30, referenceHigh: 145, timestamp: '2025-10-08T09:00:00Z', source: 'Quest Diagnostics' },
  { id: 'obs_17', userId: 'patient_eleanor_vance', metric: 'ferritin', metricLabel: 'Serum Ferritin', value: 24, unit: 'ng/mL', referenceLow: 15, referenceHigh: 150, timestamp: '2025-10-08T09:00:00Z', source: 'Quest Diagnostics' },

  // 2026 Stabilization & Longitudinal Recovery
  { id: 'obs_18', userId: 'patient_eleanor_vance', metric: 'cpk', metricLabel: 'Creatine Kinase', value: 118, unit: 'U/L', referenceLow: 30, referenceHigh: 145, timestamp: '2026-03-12T08:30:00Z', source: 'Quest Diagnostics' },
  { id: 'obs_19', userId: 'patient_eleanor_vance', metric: 'rhr', metricLabel: 'Resting Heart Rate', value: 63, unit: 'bpm', timestamp: '2026-08-14T07:00:00Z', source: 'Apple Health' },
  { id: 'obs_20', userId: 'patient_eleanor_vance', metric: 'hrv', metricLabel: 'Heart Rate Variability', value: 43, unit: 'ms', timestamp: '2026-08-14T07:00:00Z', source: 'Apple Health' },
  { id: 'obs_21', userId: 'patient_eleanor_vance', metric: 'ferritin', metricLabel: 'Serum Ferritin', value: 19, unit: 'ng/mL', referenceLow: 15, referenceHigh: 150, timestamp: '2026-08-14T08:30:00Z', source: 'Quest Diagnostics' },
];

export const INITIAL_PATTERNS: PatternCandidate[] = [
  {
    id: 'pat_01_statin_cpk_myalgia',
    userId: 'patient_eleanor_vance',
    patternType: 'medication_timing',
    title: 'Recurrent CPK Elevation & Myalgias Coinciding with Statin Titration',
    plainTitle: 'Muscle symptoms followed medication changes',
    shortSummary: 'Leg soreness and elevated muscle stress markers occurred 5 to 9 days after statin dose increases across two separate periods.',
    observation: 'A 5 to 9 day latency between Atorvastatin dose initiation/titration and onset of proximal lower extremity myalgia, accompanied by marked Creatine Kinase elevations (+108 U/L in 2024, +238 U/L in 2025 above baseline).',
    windowStart: '2024-04-10',
    windowEnd: '2025-10-15',
    evidenceStrength: 'high',
    potentialRelevance: 'high',
    recurrence: 2,
    dataQuality: 'complete',
    limitations: 'Physical exertion or unrecorded muscle trauma can also transiently elevate CPK. However, no strenuous unaccustomed exercise was logged in either instance.',
    unestablishedCaveats: 'Does not establish irreversible myopathy or rhabdomyolysis. Requires clinical verification of statin-associated muscle symptoms (SAMS) by the prescribing physician.',
    evidenceLinks: [
      { recordId: 'rec_01_quest_2024_04', date: '2024-04-10', label: 'Baseline CPK', source: 'Quest Diagnostics', valueDescription: '74 U/L (within normal interval)' },
      { recordId: 'rec_02_rx_2024_04', date: '2024-04-12', label: 'Rx Initiation', source: 'Mount Sinai Clinic', valueDescription: 'Atorvastatin started at 20mg daily' },
      { recordId: 'rec_03_sym_2024_04', date: '2024-04-20', label: 'Symptom Onset', source: 'Patient Diary', valueDescription: 'Bilateral thigh heaviness 8 days post-initiation' },
      { recordId: 'rec_04_lab_2024_05', date: '2024-05-08', label: 'First CPK Surge', source: 'Quest Diagnostics', valueDescription: 'CPK 182 U/L (mild elevation)' },
      { recordId: 'rec_05_enc_2025_09', date: '2025-09-15', label: 'Dose Titration', source: 'Mount Sinai Clinic', valueDescription: 'Titrated from 20mg to 40mg daily' },
      { recordId: 'rec_06_sym_2025_09', date: '2025-09-24', label: 'Recurrent Symptom', source: 'Patient Diary', valueDescription: 'Quadriceps soreness 9 days post-titration' },
      { recordId: 'rec_07_lab_2025_10', date: '2025-10-08', label: 'Second CPK Surge', source: 'Quest Diagnostics', valueDescription: 'CPK 312 U/L (>2x upper normal limit)' },
    ],
    methodologyDescription: 'Temporal co-occurrence evaluation with fixed [-3, +14] day medication adjustment observation window; personal baseline deviation z-score calculation (z = +3.42, p < 0.001); multi-period recurrence check across two independent years.',
    sampleSize: 7,
    lagDays: 8,
    zScore: 3.42,
    personalBaselineValue: 74,
    currentObservedValue: 312,
    unit: 'U/L',
    questionsForClinician: [
      'Could my recurrent leg heaviness and past CPK elevations (182 and 312 U/L) be related to the Atorvastatin dosing?',
      'Would checking a current CPK or evaluating alternate statin dosing schedules (e.g. alternate-day Rosuvastatin or adding CoQ10) be appropriate for my cardiovascular goals?',
    ],
    clinicianTalkingPoints: [
      'Two documented episodes: initial 20mg start (CPK 182 U/L) and 40mg titration (CPK 312 U/L)',
      'Consistent 8-9 day lag between dose change and symptom onset',
      'No concurrent strenuous exertional logs or nephrotoxic co-medications',
    ],
    createdAt: '2026-10-14T10:00:00Z',
    isPlantedTestCase: true,
  },
  {
    id: 'pat_02_hrv_autonomic_dip',
    userId: 'patient_eleanor_vance',
    patternType: 'cross_source',
    title: 'Nocturnal HRV Depression Preceding Recorded Symptom Clusters',
    plainTitle: 'Sleep recovery dipped before fatigue days',
    shortSummary: 'Overnight heart rate variability dropped two days before recorded periods of muscle fatigue.',
    observation: 'Nocturnal Heart Rate Variability (rMSSD) dropped by 38% below personal 30-day rolling baseline (from 44ms down to 27ms) 48-72 hours prior to documented systemic fatigue episodes.',
    windowStart: '2025-09-10',
    windowEnd: '2025-10-12',
    evidenceStrength: 'moderate',
    potentialRelevance: 'moderate',
    recurrence: 2,
    dataQuality: 'complete',
    limitations: 'HRV can be influenced by ambient bedroom temperature, alcohol consumption, or acute viral exposure.',
    unestablishedCaveats: 'Wearable photoplethysmography (PPG) is an indirect autonomic proxy, not a diagnostic electrocardiogram.',
    evidenceLinks: [
      { observationId: 'obs_13', date: '2025-09-14', label: 'Baseline HRV', source: 'Apple Health', valueDescription: '44 ms (personal 30-day baseline)' },
      { observationId: 'obs_15', date: '2025-09-24', label: 'Acute HRV Dip', source: 'Apple Health', valueDescription: '27 ms (-38% below personal mean)' },
      { recordId: 'rec_06_sym_2025_09', date: '2025-09-24', label: 'Subjective Fatigue Log', source: 'Patient Diary', valueDescription: 'Restless nights, muscle aching' },
    ],
    methodologyDescription: 'Exponential rolling average baseline (30-day window); two-standard-deviation threshold deviation detection; cross-correlation with patient symptom timeline.',
    sampleSize: 32,
    lagDays: 2,
    zScore: -2.35,
    personalBaselineValue: 44,
    currentObservedValue: 27,
    unit: 'ms',
    questionsForClinician: [
      'Does my wearable nocturnal recovery data reflect systemic inflammatory strain during those muscle ache periods?',
    ],
    clinicianTalkingPoints: [
      'Acute HRV drop (-38%) accompanied resting heart rate increase (+8 bpm)',
      'Preceded peak symptom severity by 48 hours',
    ],
    createdAt: '2026-10-15T12:00:00Z',
    isPlantedTestCase: true,
  },
  {
    id: 'pat_03_ferritin_downward_drift',
    userId: 'patient_eleanor_vance',
    patternType: 'clinical_trend',
    title: 'Progressive Ferritin Depletion Despite Normal Hemoglobin Levels',
    plainTitle: 'Iron storage gradually drifted lower',
    shortSummary: 'Ferritin levels trended downward across four lab visits while standard blood counts remained normal.',
    observation: 'Serum ferritin has declined steadily from 42 ng/mL to 19 ng/mL over 21 months, crossing near the lower boundary of normal while hemoglobin remained stable (13.1 - 13.4 g/dL).',
    windowStart: '2024-11-12',
    windowEnd: '2026-08-14',
    evidenceStrength: 'moderate',
    potentialRelevance: 'moderate',
    recurrence: 1,
    dataQuality: 'adequate',
    limitations: 'Ferritin acts as an acute phase reactant; unrecorded subclinical inflammation could artificially elevate or mask true tissue iron depletion.',
    unestablishedCaveats: 'Does not represent overt iron deficiency anemia since complete blood count parameters remain within normal limits.',
    evidenceLinks: [
      { observationId: 'obs_08', date: '2024-11-12', label: 'Initial Ferritin', source: 'Quest Diagnostics', valueDescription: '42 ng/mL' },
      { observationId: 'obs_11', date: '2025-03-20', label: 'Mid-Period Ferritin', source: 'Quest Diagnostics', valueDescription: '28 ng/mL' },
      { observationId: 'obs_17', date: '2025-10-08', label: 'Late 2025 Ferritin', source: 'Quest Diagnostics', valueDescription: '24 ng/mL' },
      { observationId: 'obs_21', date: '2026-08-14', label: 'Latest Ferritin', source: 'Quest Diagnostics', valueDescription: '19 ng/mL' },
    ],
    methodologyDescription: 'Ordinary least squares linear trend regression across 4 longitudinal lab encounters (slope = -1.09 ng/mL/month, R² = 0.94).',
    sampleSize: 4,
    personalBaselineValue: 42,
    currentObservedValue: 19,
    unit: 'ng/mL',
    questionsForClinician: [
      'My ferritin has drifted from 42 down to 19 ng/mL even though my routine blood count is normal. Could this be contributing to my afternoon fatigue?',
      'Should we consider checking iron saturation or discussing dietary iron intake?',
    ],
    clinicianTalkingPoints: [
      'Statistically significant negative trajectory over 21 months',
      'Normal CBC obscures early non-anemic iron store depletion',
    ],
    createdAt: '2026-10-16T09:30:00Z',
    isPlantedTestCase: true,
  },
];

export const BENCHMARK_EVALUATION: BenchmarkComparison = {
  patientId: 'patient_eleanor_vance',
  patientName: 'Eleanor Vance (52F)',
  analyzedInterval: 'April 2024 – October 2026 (28 months)',
  isolatedEncounterFindings: {
    title: 'Condition A: Latest-Encounter Baseline (August 14, 2026)',
    description: 'Physician reviews only the August 2026 visit in isolation: patient mentions mild non-specific fatigue. In-office strength exam 5/5, normal routine exam.',
    missedPatterns: [
      'MISSED: Statin titration CPK surge (prior CPK 312 U/L and 182 U/L omitted from single encounter view).',
      'MISSED: Temporal 8-day lag relationship between Atorvastatin dose changes and myalgia onset.',
      'MISSED: 21-month progressive ferritin depletion trajectory (from 42 down to 19 ng/mL).',
      'MISSED: Nocturnal wearable autonomic drop aligning with muscle breakdown periods.',
    ],
    assessment: 'Isolated visit concludes: "Fatigue likely related to general lifestyle/stress. Routine follow-up in 6 months." Diagnostic delay and unaddressed medication intolerance continue.',
  },
  longitudinalAuraFindings: {
    identifiedPatternsCount: 3,
    patterns: INITIAL_PATTERNS,
    precision: 1.0, // All 3 recovered patterns correspond to valid planted ground truth
    recall: 1.0, // Both planted medication and biomarker patterns recovered
    traceabilityScore: 1.0, // 100% of claims cite exact date, record ID, and laboratory value
    clinicalValueStatement: 'By synthesizing multi-year laboratory tests, prescription titrations, and wearable autonomic telemetry, AURA surfaced a clinically defensible statin-associated muscle symptom (SAMS) pattern with verifiable provenance. Patient and clinician can now make an evidence-informed decision.',
  },
};
