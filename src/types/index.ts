export type UserRole = 'patient' | 'clinician' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
  connectedProviders?: ConnectedProvider[];
}

export type RecordType =
  | 'prescription'
  | 'lab_report'
  | 'clinical_note'
  | 'medication'
  | 'symptom'
  | 'wearable_summary'
  | 'other_document';

export type RecordStatus = 'confirmed' | 'pending_review' | 'rejected';

export interface ExtractedFact {
  id: string;
  metricKey: string;
  metricLabel: string;
  numericValue: number | null;
  unit: string;
  referenceLow?: number;
  referenceHigh?: number;
  status: 'normal' | 'elevated' | 'low' | 'recorded';
  confidence: number;
  requiresConfirmation: boolean;
  sourceSnippet: string;
}

export interface AttachedFile {
  name: string;
  type: string; // e.g. 'application/pdf', 'image/png', 'image/jpeg'
  size: number;
  dataUrl?: string; // base64 data URL for preview and viewing
  storagePath?: string;
  uploadedAt?: string;
}

export interface PrescriptionDetails {
  medicationName: string;
  strength?: string | null;
  dosage?: string | null;
  frequency?: string | null;
  route?: string | null;
  duration?: string | null;
  prescribingClinician?: string | null;
  prescriptionDate?: string | null;
  refills?: string | number | null;
  instructions?: string | null;
  isTakenConfirmed?: boolean; // distinguishes prescription authorization from confirmed intake
}

export interface HealthRecord {
  id: string;
  userId: string;
  title: string;
  recordType: RecordType;
  source: string;
  date: string; // YYYY-MM-DD
  status: RecordStatus;
  summary: string;
  rawContent?: string;
  attachedFile?: AttachedFile;
  prescriptionDetails?: PrescriptionDetails;
  extractedFacts?: ExtractedFact[];
  createdAt: string;
  updatedAt?: string;
  clinicianNotes?: string;
}

export interface Observation {
  id: string;
  userId: string;
  recordId?: string;
  metric: string;
  metricLabel: string;
  value: number;
  unit: string;
  referenceLow?: number;
  referenceHigh?: number;
  timestamp: string; // ISO
  source: string;
  isSynthetic?: boolean;
}

export type PatternType =
  | 'personal_baseline_deviation'
  | 'temporal_association'
  | 'recurrent_sequence'
  | 'medication_timing'
  | 'clinical_trend'
  | 'cross_source';

export type EvidenceStrength = 'high' | 'moderate' | 'exploratory';
export type PotentialRelevance = 'high' | 'moderate' | 'low';
export type DataQualityTier = 'complete' | 'adequate' | 'sparse';

export interface EvidenceLink {
  recordId?: string;
  observationId?: string;
  date: string;
  label: string;
  source: string;
  valueDescription: string;
}

export interface PatternCandidate {
  id: string;
  userId: string;
  patternType: PatternType;
  title: string;
  plainTitle?: string;
  shortSummary?: string;
  observation: string;
  windowStart: string;
  windowEnd: string;
  evidenceStrength: EvidenceStrength;
  potentialRelevance: PotentialRelevance;
  recurrence: number;
  dataQuality: DataQualityTier;
  limitations: string;
  unestablishedCaveats?: string;
  evidenceLinks: EvidenceLink[];
  methodologyDescription: string;
  sampleSize: number;
  lagDays?: number;
  zScore?: number;
  personalBaselineValue?: number;
  currentObservedValue?: number;
  unit?: string;
  questionsForClinician: string[];
  clinicianTalkingPoints?: string[];
  createdAt: string;
  isPlantedTestCase?: boolean;
}

export type ReviewStatus = 'reviewed' | 'not_relevant' | 'requires_followup';

export interface ClinicianReview {
  id: string;
  patternId: string;
  patientId: string;
  clinicianUid: string;
  clinicianName: string;
  status: ReviewStatus;
  notes: string;
  reviewedAt: string;
}

export interface ConnectedProvider {
  id: string;
  name: string;
  category: 'wearable' | 'laboratory' | 'ehr';
  icon: string;
  status: 'connected' | 'syncing' | 'stale' | 'disconnected' | 'error';
  lastSync: string;
  metricsProvided: string[];
  isDemo?: boolean;
}

export interface BenchmarkComparison {
  patientId: string;
  patientName: string;
  analyzedInterval: string;
  isolatedEncounterFindings: {
    title: string;
    description: string;
    missedPatterns: string[];
    assessment: string;
  };
  longitudinalAuraFindings: {
    identifiedPatternsCount: number;
    patterns: PatternCandidate[];
    precision: number;
    recall: number;
    traceabilityScore: number;
    clinicalValueStatement: string;
  };
}
