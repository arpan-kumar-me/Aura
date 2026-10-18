import {
  HealthRecord,
  Observation,
  PatternCandidate,
  ClinicianReview,
  ConnectedProvider,
} from '../types';
import {
  INITIAL_RECORDS,
  INITIAL_OBSERVATIONS,
  INITIAL_PATTERNS,
  INITIAL_PROVIDERS,
} from '../data/seedData';

// Namespace keys for complete isolation between demo data, sandbox user data, and real patient records
const STORAGE_PREFIX = 'aura_nobilling_v1_';
const KEYS = {
  DEMO_RECORDS: `${STORAGE_PREFIX}demo_records`,
  DEMO_OBSERVATIONS: `${STORAGE_PREFIX}demo_observations`,
  DEMO_PATTERNS: `${STORAGE_PREFIX}demo_patterns`,
  DEMO_PROVIDERS: `${STORAGE_PREFIX}demo_providers`,
  DEMO_REVIEWS: `${STORAGE_PREFIX}demo_reviews`,

  SANDBOX_RECORDS: `${STORAGE_PREFIX}sandbox_records`,
  SANDBOX_OBSERVATIONS: `${STORAGE_PREFIX}sandbox_observations`,
  SANDBOX_PATTERNS: `${STORAGE_PREFIX}sandbox_patterns`,
  SANDBOX_PROVIDERS: `${STORAGE_PREFIX}sandbox_providers`,
  SANDBOX_REVIEWS: `${STORAGE_PREFIX}sandbox_reviews`,

  PERSISTENCE_MODE: `${STORAGE_PREFIX}persistence_mode`,
};

function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`[AURA Storage] Failed to read key "${key}" from localStorage:`, err);
    return fallback;
  }
}

function safeSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`[AURA Storage] Failed to write key "${key}" to localStorage:`, err);
  }
}

export const localStorageService = {
  // Demo Dataset Accessors
  getDemoRecords(): HealthRecord[] {
    return safeGet<HealthRecord[]>(KEYS.DEMO_RECORDS, INITIAL_RECORDS);
  },
  saveDemoRecords(records: HealthRecord[]): void {
    safeSet(KEYS.DEMO_RECORDS, records);
  },

  getDemoObservations(): Observation[] {
    return safeGet<Observation[]>(KEYS.DEMO_OBSERVATIONS, INITIAL_OBSERVATIONS);
  },
  saveDemoObservations(observations: Observation[]): void {
    safeSet(KEYS.DEMO_OBSERVATIONS, observations);
  },

  getDemoPatterns(): PatternCandidate[] {
    return safeGet<PatternCandidate[]>(KEYS.DEMO_PATTERNS, INITIAL_PATTERNS);
  },
  saveDemoPatterns(patterns: PatternCandidate[]): void {
    safeSet(KEYS.DEMO_PATTERNS, patterns);
  },

  getDemoProviders(): ConnectedProvider[] {
    return safeGet<ConnectedProvider[]>(KEYS.DEMO_PROVIDERS, INITIAL_PROVIDERS);
  },
  saveDemoProviders(providers: ConnectedProvider[]): void {
    safeSet(KEYS.DEMO_PROVIDERS, providers);
  },

  getDemoReviews(): Record<string, ClinicianReview> {
    return safeGet<Record<string, ClinicianReview>>(KEYS.DEMO_REVIEWS, {});
  },
  saveDemoReviews(reviews: Record<string, ClinicianReview>): void {
    safeSet(KEYS.DEMO_REVIEWS, reviews);
  },

  resetDemoData(): {
    records: HealthRecord[];
    observations: Observation[];
    patterns: PatternCandidate[];
    providers: ConnectedProvider[];
    reviews: Record<string, ClinicianReview>;
  } {
    safeSet(KEYS.DEMO_RECORDS, INITIAL_RECORDS);
    safeSet(KEYS.DEMO_OBSERVATIONS, INITIAL_OBSERVATIONS);
    safeSet(KEYS.DEMO_PATTERNS, INITIAL_PATTERNS);
    safeSet(KEYS.DEMO_PROVIDERS, INITIAL_PROVIDERS);
    safeSet(KEYS.DEMO_REVIEWS, {});
    return {
      records: INITIAL_RECORDS,
      observations: INITIAL_OBSERVATIONS,
      patterns: INITIAL_PATTERNS,
      providers: INITIAL_PROVIDERS,
      reviews: {},
    };
  },

  // Sandbox Dataset Accessors (Clean Slate for User Testing)
  getSandboxRecords(): HealthRecord[] {
    return safeGet<HealthRecord[]>(KEYS.SANDBOX_RECORDS, []);
  },
  saveSandboxRecords(records: HealthRecord[]): void {
    safeSet(KEYS.SANDBOX_RECORDS, records);
  },

  getSandboxObservations(): Observation[] {
    return safeGet<Observation[]>(KEYS.SANDBOX_OBSERVATIONS, []);
  },
  saveSandboxObservations(observations: Observation[]): void {
    safeSet(KEYS.SANDBOX_OBSERVATIONS, observations);
  },

  getSandboxPatterns(): PatternCandidate[] {
    return safeGet<PatternCandidate[]>(KEYS.SANDBOX_PATTERNS, []);
  },
  saveSandboxPatterns(patterns: PatternCandidate[]): void {
    safeSet(KEYS.SANDBOX_PATTERNS, patterns);
  },

  getSandboxProviders(): ConnectedProvider[] {
    const defaultProviders = INITIAL_PROVIDERS.map((p) => ({
      ...p,
      status: 'disconnected' as const,
      lastSync: 'Not connected',
    }));
    return safeGet<ConnectedProvider[]>(KEYS.SANDBOX_PROVIDERS, defaultProviders);
  },
  saveSandboxProviders(providers: ConnectedProvider[]): void {
    safeSet(KEYS.SANDBOX_PROVIDERS, providers);
  },

  getSandboxReviews(): Record<string, ClinicianReview> {
    return safeGet<Record<string, ClinicianReview>>(KEYS.SANDBOX_REVIEWS, {});
  },
  saveSandboxReviews(reviews: Record<string, ClinicianReview>): void {
    safeSet(KEYS.SANDBOX_REVIEWS, reviews);
  },

  resetSandboxData(): void {
    safeSet(KEYS.SANDBOX_RECORDS, []);
    safeSet(KEYS.SANDBOX_OBSERVATIONS, []);
    safeSet(KEYS.SANDBOX_PATTERNS, []);
    safeSet(
      KEYS.SANDBOX_PROVIDERS,
      INITIAL_PROVIDERS.map((p) => ({
        ...p,
        status: 'disconnected' as const,
        lastSync: 'Not connected',
      }))
    );
    safeSet(KEYS.SANDBOX_REVIEWS, {});
  },

  // Mode Preference
  getStorageMode(): 'local' | 'cloud' {
    return safeGet<'local' | 'cloud'>(KEYS.PERSISTENCE_MODE, 'local');
  },
  setStorageMode(mode: 'local' | 'cloud'): void {
    safeSet(KEYS.PERSISTENCE_MODE, mode);
  },
};
