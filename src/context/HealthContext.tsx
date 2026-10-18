import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  HealthRecord,
  Observation,
  PatternCandidate,
  ClinicianReview,
  ConnectedProvider,
  ReviewStatus,
  ExtractedFact,
  PrescriptionDetails,
  AttachedFile,
  RecordType,
} from '../types';
import { INITIAL_PATIENT } from '../data/seedData';
import { runLongitudinalAnalysis } from '../services/patternEngine';
import { localStorageService } from '../services/localStorageService';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
} from 'firebase/firestore';

export type PatientMode = 'demo' | 'new_patient' | 'authenticated';
export type StorageMode = 'local' | 'cloud';

export interface PatientProfileData {
  uid: string;
  displayName: string;
  gender: string;
  age: number | string;
  mrn: string;
  primaryPhysician: string;
  primaryConditions: string[];
  allergies: string[];
}

const NEW_PATIENT_INITIAL_PROFILE: PatientProfileData = {
  uid: 'patient_new_onboarding',
  displayName: 'Sandbox Patient',
  gender: 'Self-reported',
  age: '—',
  mrn: 'SANDBOX-0001',
  primaryPhysician: 'Unassigned',
  primaryConditions: [],
  allergies: [],
};

interface HealthContextType {
  currentUser: User | null;
  authLoading: boolean;
  patientMode: PatientMode;
  setPatientMode: (mode: PatientMode) => void;
  storageMode: StorageMode;
  setStorageMode: (mode: StorageMode) => void;
  resetNewPatientState: () => void;
  resetDemoData: () => void;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  patient: PatientProfileData;
  records: HealthRecord[];
  observations: Observation[];
  patterns: PatternCandidate[];
  reviews: Record<string, ClinicianReview>;
  connectedProviders: ConnectedProvider[];
  selectedPattern: PatternCandidate | null;
  setSelectedPattern: (p: PatternCandidate | null) => void;
  selectedRecord: HealthRecord | null;
  setSelectedRecord: (r: HealthRecord | null) => void;
  isAddRecordModalOpen: boolean;
  setIsAddRecordModalOpen: (open: boolean) => void;
  initialRecordType: RecordType;
  openAddRecordModal: (initialType?: RecordType) => void;
  addRecord: (
    newRecord: Partial<HealthRecord>,
    facts: ExtractedFact[],
    prescriptionDetails?: PrescriptionDetails,
    attachedFile?: AttachedFile
  ) => Promise<void>;
  updateFactConfirmation: (recordId: string, factId: string, confirmed: boolean, correctedVal?: number | null) => void;
  updatePrescriptionIntakeConfirmation: (recordId: string, confirmed: boolean) => Promise<void>;
  updatePrescriptionDetails: (recordId: string, details: Partial<PrescriptionDetails>) => Promise<void>;
  saveClinicianReview: (patternId: string, status: ReviewStatus, notes: string) => Promise<void>;
  toggleProviderStatus: (providerId: string) => void;
  runAnalysis: () => void;
}

const HealthContext = createContext<HealthContextType | undefined>(undefined);

export const HealthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [patientMode, setPatientModeState] = useState<PatientMode>('demo');
  const [storageMode, setStorageModeState] = useState<StorageMode>(() => localStorageService.getStorageMode());
  const [initialRecordType, setInitialRecordType] = useState<RecordType>('prescription');

  // Eleanor Vance demo dataset (backed by localStorage with fallback to INITIAL_* seed data)
  const [demoRecords, setDemoRecords] = useState<HealthRecord[]>(() => localStorageService.getDemoRecords());
  const [demoObservations, setDemoObservations] = useState<Observation[]>(() => localStorageService.getDemoObservations());
  const [demoPatterns, setDemoPatterns] = useState<PatternCandidate[]>(() => localStorageService.getDemoPatterns());
  const [demoProviders, setDemoProviders] = useState<ConnectedProvider[]>(() => localStorageService.getDemoProviders());
  const [demoReviews, setDemoReviews] = useState<Record<string, ClinicianReview>>(() => localStorageService.getDemoReviews());

  // Isolated Sandbox / New Patient dataset (clean slate backed by localStorage)
  const [newPatientRecords, setNewPatientRecords] = useState<HealthRecord[]>(() => localStorageService.getSandboxRecords());
  const [newPatientObservations, setNewPatientObservations] = useState<Observation[]>(() => localStorageService.getSandboxObservations());
  const [newPatientPatterns, setNewPatientPatterns] = useState<PatternCandidate[]>(() => localStorageService.getSandboxPatterns());
  const [newPatientProviders, setNewPatientProviders] = useState<ConnectedProvider[]>(() => localStorageService.getSandboxProviders());
  const [newPatientReviews, setNewPatientReviews] = useState<Record<string, ClinicianReview>>(() => localStorageService.getSandboxReviews());

  // Authenticated user dataset (isolated)
  const [authRecords, setAuthRecords] = useState<HealthRecord[]>([]);
  const [authObservations, setAuthObservations] = useState<Observation[]>([]);
  const [authPatterns, setAuthPatterns] = useState<PatternCandidate[]>([]);
  const [authProviders, setAuthProviders] = useState<ConnectedProvider[]>(() => localStorageService.getSandboxProviders());
  const [authReviews, setAuthReviews] = useState<Record<string, ClinicianReview>>({});

  const [selectedPattern, setSelectedPattern] = useState<PatternCandidate | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<HealthRecord | null>(null);
  const [isAddRecordModalOpen, setIsAddRecordModalOpen] = useState(false);

  const setStorageMode = (mode: StorageMode) => {
    setStorageModeState(mode);
    localStorageService.setStorageMode(mode);
  };

  // Monitor Firebase Auth State (Defensive, non-blocking)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setAuthLoading(false);

      if (user) {
        setPatientModeState('authenticated');
        // Only attempt remote Firestore read if user or app explicitly activates cloud mode
        if (storageMode === 'cloud') {
          try {
            const recsPath = `users/${user.uid}/records`;
            const recSnap = await getDocs(query(collection(db, recsPath)));
            const loadedRecs: HealthRecord[] = [];
            if (!recSnap.empty) {
              recSnap.forEach((d) => loadedRecs.push(d.data() as HealthRecord));
              setAuthRecords(loadedRecs);
            } else {
              setAuthRecords([]);
            }

            const obsPath = `users/${user.uid}/observations`;
            const obsSnap = await getDocs(query(collection(db, obsPath)));
            const loadedObs: Observation[] = [];
            if (!obsSnap.empty) {
              obsSnap.forEach((d) => loadedObs.push(d.data() as Observation));
              setAuthObservations(loadedObs);
            } else {
              setAuthObservations([]);
            }

            const revPath = `users/${user.uid}/reviews`;
            const revSnap = await getDocs(query(collection(db, revPath)));
            const loadedRevs: Record<string, ClinicianReview> = {};
            if (!revSnap.empty) {
              revSnap.forEach((d) => {
                const r = d.data() as ClinicianReview;
                loadedRevs[r.patternId] = r;
              });
              setAuthReviews(loadedRevs);
            } else {
              setAuthReviews({});
            }

            if (loadedRecs.length >= 2) {
              const calculatedPatterns = runLongitudinalAnalysis(loadedRecs, loadedObs, user.uid);
              setAuthPatterns(calculatedPatterns);
            } else {
              setAuthPatterns([]);
            }
          } catch (err) {
            console.warn('[AURA HealthContext] Cloud Firestore read deferred or unavailable; falling back to local session:', err);
            // Fall back to local session so user experience is not disrupted
            setAuthRecords([]);
            setAuthObservations([]);
            setAuthPatterns([]);
          }
        }
      } else {
        // If logged out, return gracefully to demo mode
        setPatientModeState((prev) => (prev === 'authenticated' ? 'demo' : prev));
      }
    });

    return () => unsubscribe();
  }, [storageMode]);

  const openAddRecordModal = (initialType?: RecordType) => {
    if (initialType) {
      setInitialRecordType(initialType);
    }
    setIsAddRecordModalOpen(true);
  };

  const setPatientMode = (mode: PatientMode) => {
    setPatientModeState(mode);
    setSelectedPattern(null);
    setSelectedRecord(null);
  };

  const resetNewPatientState = () => {
    localStorageService.resetSandboxData();
    setNewPatientRecords([]);
    setNewPatientObservations([]);
    setNewPatientPatterns([]);
    setNewPatientProviders(localStorageService.getSandboxProviders());
    setNewPatientReviews({});
    setSelectedPattern(null);
    setSelectedRecord(null);
  };

  const resetDemoData = () => {
    const fresh = localStorageService.resetDemoData();
    setDemoRecords(fresh.records);
    setDemoObservations(fresh.observations);
    setDemoPatterns(fresh.patterns);
    setDemoProviders(fresh.providers);
    setDemoReviews(fresh.reviews);
    setSelectedPattern(null);
    setSelectedRecord(null);
  };

  // Determine active patient data based on mode
  const effectiveMode: PatientMode = currentUser && storageMode === 'cloud' ? 'authenticated' : patientMode;

  const patient: PatientProfileData = (() => {
    if (effectiveMode === 'authenticated' && currentUser) {
      return {
        uid: currentUser.uid,
        displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Patient Account',
        gender: 'Self-reported',
        age: '—',
        mrn: `AURA-${currentUser.uid.slice(0, 8).toUpperCase()}`,
        primaryPhysician: 'Unassigned',
        primaryConditions: [],
        allergies: [],
      };
    }
    if (effectiveMode === 'new_patient') {
      return NEW_PATIENT_INITIAL_PROFILE;
    }
    return INITIAL_PATIENT;
  })();

  const records = (() => {
    if (effectiveMode === 'authenticated') return authRecords;
    if (effectiveMode === 'new_patient') return newPatientRecords;
    return demoRecords;
  })();

  const observations = (() => {
    if (effectiveMode === 'authenticated') return authObservations;
    if (effectiveMode === 'new_patient') return newPatientObservations;
    return demoObservations;
  })();

  const patterns = (() => {
    if (effectiveMode === 'authenticated') return authPatterns;
    if (effectiveMode === 'new_patient') return newPatientPatterns;
    return demoPatterns;
  })();

  const connectedProviders = (() => {
    if (effectiveMode === 'authenticated') return authProviders;
    if (effectiveMode === 'new_patient') return newPatientProviders;
    return demoProviders;
  })();

  const reviews = (() => {
    if (effectiveMode === 'authenticated') return authReviews;
    if (effectiveMode === 'new_patient') return newPatientReviews;
    return demoReviews;
  })();

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.warn('[AURA Auth] Google sign-in cancelled or interrupted:', error);
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setCurrentUser(null);
      setPatientModeState('demo');
    } catch (error) {
      console.warn('[AURA Auth] Sign-out error:', error);
    }
  };

  const runAnalysis = () => {
    if (records.length < 2) {
      if (effectiveMode === 'authenticated') setAuthPatterns([]);
      else if (effectiveMode === 'new_patient') {
        setNewPatientPatterns([]);
        localStorageService.saveSandboxPatterns([]);
      }
      return;
    }
    const generated = runLongitudinalAnalysis(records, observations, patient.uid);
    if (effectiveMode === 'authenticated') {
      setAuthPatterns(generated);
    } else if (effectiveMode === 'new_patient') {
      setNewPatientPatterns(generated);
      localStorageService.saveSandboxPatterns(generated);
    } else {
      setDemoPatterns(generated);
      localStorageService.saveDemoPatterns(generated);
    }
  };

  const addRecord = async (
    newRecord: Partial<HealthRecord>,
    facts: ExtractedFact[],
    prescriptionDetails?: PrescriptionDetails,
    attachedFile?: AttachedFile
  ) => {
    const id = `rec_${Date.now()}`;
    const fullRecord: HealthRecord = {
      id,
      userId: patient.uid,
      title: newRecord.title || 'Untitled Medical Record',
      recordType: newRecord.recordType || 'clinical_note',
      source: newRecord.source || 'Uploaded Document',
      date: newRecord.date || new Date().toISOString().split('T')[0],
      status: 'confirmed',
      summary: newRecord.summary || 'Uploaded clinical information.',
      rawContent: newRecord.rawContent || '',
      attachedFile: attachedFile || newRecord.attachedFile,
      prescriptionDetails: prescriptionDetails || newRecord.prescriptionDetails,
      extractedFacts: facts,
      createdAt: new Date().toISOString(),
    };

    // Create discrete observations from extracted facts
    const newObservations: Observation[] = facts
      .filter((f) => f.numericValue !== null)
      .map((f, idx) => ({
        id: `obs_${Date.now()}_${idx}`,
        userId: patient.uid,
        recordId: id,
        metric: f.metricKey,
        metricLabel: f.metricLabel,
        value: f.numericValue!,
        unit: f.unit,
        referenceLow: f.referenceLow,
        referenceHigh: f.referenceHigh,
        timestamp: `${fullRecord.date}T10:00:00Z`,
        source: fullRecord.source,
      }));

    // If prescription has numeric strength, link as observation
    if (fullRecord.recordType === 'prescription' && fullRecord.prescriptionDetails) {
      const rx = fullRecord.prescriptionDetails;
      const numMatch = rx.strength ? parseFloat(rx.strength) : null;
      if (numMatch && !isNaN(numMatch)) {
        newObservations.push({
          id: `obs_${Date.now()}_rx`,
          userId: patient.uid,
          recordId: id,
          metric: rx.medicationName.toLowerCase().replace(/[^a-z0-9]/g, '_'),
          metricLabel: `${rx.medicationName} Dose`,
          value: numMatch,
          unit: rx.strength ? rx.strength.replace(/[0-9\.\s]/g, '') : 'mg',
          timestamp: `${fullRecord.date}T09:00:00Z`,
          source: fullRecord.source,
        });
      }
    }

    const updatedRecords = [fullRecord, ...records];
    const updatedObservations = [...observations, ...newObservations];

    // Re-evaluate patterns when longitudinal criteria are satisfied (at least 2 records)
    let newPatterns: PatternCandidate[] = [];
    if (updatedRecords.length >= 2) {
      newPatterns = runLongitudinalAnalysis(updatedRecords, updatedObservations, patient.uid);
    }

    if (effectiveMode === 'authenticated' && currentUser && storageMode === 'cloud') {
      setAuthRecords(updatedRecords);
      setAuthObservations(updatedObservations);
      setAuthPatterns(newPatterns);
      try {
        const recPath = `users/${currentUser.uid}/records`;
        await setDoc(doc(db, recPath, id), fullRecord);

        for (const obs of newObservations) {
          const obsPath = `users/${currentUser.uid}/observations`;
          await setDoc(doc(db, obsPath, obs.id), obs);
        }
      } catch (err) {
        console.warn('[AURA Firestore] Cloud write fallback:', err);
      }
    } else if (effectiveMode === 'new_patient') {
      setNewPatientRecords(updatedRecords);
      setNewPatientObservations(updatedObservations);
      setNewPatientPatterns(newPatterns);
      localStorageService.saveSandboxRecords(updatedRecords);
      localStorageService.saveSandboxObservations(updatedObservations);
      localStorageService.saveSandboxPatterns(newPatterns);
    } else {
      setDemoRecords(updatedRecords);
      setDemoObservations(updatedObservations);
      setDemoPatterns(newPatterns);
      localStorageService.saveDemoRecords(updatedRecords);
      localStorageService.saveDemoObservations(updatedObservations);
      localStorageService.saveDemoPatterns(newPatterns);
    }
  };

  const updateFactConfirmation = (
    recordId: string,
    factId: string,
    confirmed: boolean,
    correctedVal?: number | null
  ) => {
    const updateList = (prev: HealthRecord[]) =>
      prev.map((rec) => {
        if (rec.id !== recordId) return rec;
        const updatedFacts = (rec.extractedFacts || []).map((f) => {
          if (f.id !== factId) return f;
          return {
            ...f,
            requiresConfirmation: !confirmed,
            numericValue: correctedVal !== undefined ? correctedVal : f.numericValue,
            status: confirmed ? ('normal' as const) : f.status,
          };
        });
        return { ...rec, extractedFacts: updatedFacts };
      });

    if (effectiveMode === 'authenticated' && storageMode === 'cloud') {
      setAuthRecords(updateList);
    } else if (effectiveMode === 'new_patient') {
      setNewPatientRecords((prev) => {
        const updated = updateList(prev);
        localStorageService.saveSandboxRecords(updated);
        return updated;
      });
    } else {
      setDemoRecords((prev) => {
        const updated = updateList(prev);
        localStorageService.saveDemoRecords(updated);
        return updated;
      });
    }
  };

  const updatePrescriptionIntakeConfirmation = async (recordId: string, confirmed: boolean) => {
    const updateList = (prev: HealthRecord[]) =>
      prev.map((rec) => {
        if (rec.id !== recordId) return rec;
        const currentRx = rec.prescriptionDetails;
        if (!currentRx) return rec;
        return {
          ...rec,
          prescriptionDetails: {
            ...currentRx,
            isTakenConfirmed: confirmed,
          },
        };
      });

    if (effectiveMode === 'authenticated' && currentUser && storageMode === 'cloud') {
      setAuthRecords(updateList);
      const target = authRecords.find((r) => r.id === recordId);
      if (target && target.prescriptionDetails) {
        const updated = {
          ...target,
          prescriptionDetails: { ...target.prescriptionDetails, isTakenConfirmed: confirmed },
        };
        try {
          await setDoc(doc(db, `users/${currentUser.uid}/records`, recordId), updated);
        } catch (err) {
          console.warn('[AURA Firestore] Failed to update prescription confirmation in cloud:', err);
        }
      }
    } else if (effectiveMode === 'new_patient') {
      setNewPatientRecords((prev) => {
        const updated = updateList(prev);
        localStorageService.saveSandboxRecords(updated);
        return updated;
      });
    } else {
      setDemoRecords((prev) => {
        const updated = updateList(prev);
        localStorageService.saveDemoRecords(updated);
        return updated;
      });
    }
  };

  const updatePrescriptionDetails = async (recordId: string, details: Partial<PrescriptionDetails>) => {
    const updateList = (prev: HealthRecord[]) =>
      prev.map((rec) => {
        if (rec.id !== recordId || !rec.prescriptionDetails) return rec;
        return {
          ...rec,
          prescriptionDetails: {
            ...rec.prescriptionDetails,
            ...details,
          },
        };
      });

    if (effectiveMode === 'authenticated' && storageMode === 'cloud') {
      setAuthRecords(updateList);
    } else if (effectiveMode === 'new_patient') {
      setNewPatientRecords((prev) => {
        const updated = updateList(prev);
        localStorageService.saveSandboxRecords(updated);
        return updated;
      });
    } else {
      setDemoRecords((prev) => {
        const updated = updateList(prev);
        localStorageService.saveDemoRecords(updated);
        return updated;
      });
    }
  };

  const saveClinicianReview = async (patternId: string, status: ReviewStatus, notes: string) => {
    const review: ClinicianReview = {
      id: `rev_${Date.now()}`,
      patternId,
      patientId: patient.uid,
      clinicianUid: currentUser?.uid || 'clinician_sarah_lin',
      clinicianName: currentUser?.displayName || 'Dr. Sarah Lin, MD',
      status,
      notes,
      reviewedAt: new Date().toISOString(),
    };

    if (effectiveMode === 'authenticated' && currentUser && storageMode === 'cloud') {
      setAuthReviews((prev) => ({ ...prev, [patternId]: review }));
      try {
        const path = `users/${currentUser.uid}/reviews`;
        await setDoc(doc(db, path, review.id), review);
      } catch (err) {
        console.warn('[AURA Firestore] Cloud review save fallback:', err);
      }
    } else if (effectiveMode === 'new_patient') {
      setNewPatientReviews((prev) => {
        const updated = { ...prev, [patternId]: review };
        localStorageService.saveSandboxReviews(updated);
        return updated;
      });
    } else {
      setDemoReviews((prev) => {
        const updated = { ...prev, [patternId]: review };
        localStorageService.saveDemoReviews(updated);
        return updated;
      });
    }
  };

  const toggleProviderStatus = (providerId: string) => {
    const updateList = (prev: ConnectedProvider[]) =>
      prev.map((p) => {
        if (p.id !== providerId) return p;
        const newStatus = p.status === 'connected' ? ('disconnected' as const) : ('connected' as const);
        return {
          ...p,
          status: newStatus,
          lastSync: newStatus === 'connected' ? 'Just now' : 'Never',
        };
      });

    if (effectiveMode === 'authenticated' && storageMode === 'cloud') {
      setAuthProviders(updateList);
    } else if (effectiveMode === 'new_patient') {
      setNewPatientProviders((prev) => {
        const updated = updateList(prev);
        localStorageService.saveSandboxProviders(updated);
        return updated;
      });
    } else {
      setDemoProviders((prev) => {
        const updated = updateList(prev);
        localStorageService.saveDemoProviders(updated);
        return updated;
      });
    }
  };

  return (
    <HealthContext.Provider
      value={{
        currentUser,
        authLoading,
        patientMode: effectiveMode,
        setPatientMode,
        storageMode,
        setStorageMode,
        resetNewPatientState,
        resetDemoData,
        signInWithGoogle,
        signOut,
        patient,
        records,
        observations,
        patterns,
        reviews,
        connectedProviders,
        selectedPattern,
        setSelectedPattern,
        selectedRecord,
        setSelectedRecord,
        isAddRecordModalOpen,
        setIsAddRecordModalOpen,
        initialRecordType,
        openAddRecordModal,
        addRecord,
        updateFactConfirmation,
        updatePrescriptionIntakeConfirmation,
        updatePrescriptionDetails,
        saveClinicianReview,
        toggleProviderStatus,
        runAnalysis,
      }}
    >
      {children}
    </HealthContext.Provider>
  );
};

export const useHealth = () => {
  const context = useContext(HealthContext);
  if (!context) {
    throw new Error('useHealth must be used within a HealthProvider');
  }
  return context;
};
