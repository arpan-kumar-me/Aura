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
import {
  INITIAL_PATIENT,
  INITIAL_RECORDS,
  INITIAL_OBSERVATIONS,
  INITIAL_PATTERNS,
  INITIAL_PROVIDERS,
} from '../data/seedData';
import { runLongitudinalAnalysis } from '../services/patternEngine';
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
  displayName: 'New Patient',
  gender: 'Not specified',
  age: '—',
  mrn: 'NEW-0001',
  primaryPhysician: 'Unassigned',
  primaryConditions: [],
  allergies: [],
};

interface HealthContextType {
  currentUser: User | null;
  authLoading: boolean;
  patientMode: PatientMode;
  setPatientMode: (mode: PatientMode) => void;
  resetNewPatientState: () => void;
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
  const [initialRecordType, setInitialRecordType] = useState<RecordType>('prescription');

  // Eleanor Vance demo dataset (preserved)
  const [demoRecords, setDemoRecords] = useState<HealthRecord[]>(INITIAL_RECORDS);
  const [demoObservations, setDemoObservations] = useState<Observation[]>(INITIAL_OBSERVATIONS);
  const [demoPatterns, setDemoPatterns] = useState<PatternCandidate[]>(INITIAL_PATTERNS);
  const [demoProviders, setDemoProviders] = useState<ConnectedProvider[]>(INITIAL_PROVIDERS);
  const [demoReviews, setDemoReviews] = useState<Record<string, ClinicianReview>>({});

  // Isolated New Patient dataset (intentional empty state for first-time onboarding)
  const [newPatientRecords, setNewPatientRecords] = useState<HealthRecord[]>([]);
  const [newPatientObservations, setNewPatientObservations] = useState<Observation[]>([]);
  const [newPatientPatterns, setNewPatientPatterns] = useState<PatternCandidate[]>([]);
  const [newPatientProviders, setNewPatientProviders] = useState<ConnectedProvider[]>(
    INITIAL_PROVIDERS.map((p) => ({ ...p, status: 'disconnected', lastSync: 'Not connected' }))
  );
  const [newPatientReviews, setNewPatientReviews] = useState<Record<string, ClinicianReview>>({});

  // Authenticated user dataset (isolated in Firestore users/{uid})
  const [authRecords, setAuthRecords] = useState<HealthRecord[]>([]);
  const [authObservations, setAuthObservations] = useState<Observation[]>([]);
  const [authPatterns, setAuthPatterns] = useState<PatternCandidate[]>([]);
  const [authProviders, setAuthProviders] = useState<ConnectedProvider[]>(
    INITIAL_PROVIDERS.map((p) => ({ ...p, status: 'disconnected', lastSync: 'Not connected' }))
  );
  const [authReviews, setAuthReviews] = useState<Record<string, ClinicianReview>>({});

  const [selectedPattern, setSelectedPattern] = useState<PatternCandidate | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<HealthRecord | null>(null);
  const [isAddRecordModalOpen, setIsAddRecordModalOpen] = useState(false);

  // Monitor Firebase Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setAuthLoading(false);

      if (user) {
        setPatientModeState('authenticated');
        // Fetch strictly from this authenticated user's isolated Firestore partition
        try {
          const recsPath = `users/${user.uid}/records`;
          const recSnap = await getDocs(query(collection(db, recsPath)));
          const loadedRecs: HealthRecord[] = [];
          if (!recSnap.empty) {
            recSnap.forEach((d) => loadedRecs.push(d.data() as HealthRecord));
            setAuthRecords(loadedRecs);
          } else {
            // New registered patient with zero records: intentionally empty
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

          // Evaluate patterns only if evidence supports it
          if (loadedRecs.length >= 2) {
            const calculatedPatterns = runLongitudinalAnalysis(loadedRecs, loadedObs, user.uid);
            setAuthPatterns(calculatedPatterns);
          } else {
            setAuthPatterns([]);
          }
        } catch (err) {
          console.error('Firestore user isolation fetch error:', err);
          setAuthRecords([]);
          setAuthObservations([]);
          setAuthPatterns([]);
        }
      } else {
        // If logged out and previously in authenticated mode, return to demo
        setPatientModeState((prev) => (prev === 'authenticated' ? 'demo' : prev));
      }
    });

    return () => unsubscribe();
  }, []);

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
    setNewPatientRecords([]);
    setNewPatientObservations([]);
    setNewPatientPatterns([]);
    setNewPatientProviders(
      INITIAL_PROVIDERS.map((p) => ({ ...p, status: 'disconnected', lastSync: 'Not connected' }))
    );
    setNewPatientReviews({});
    setSelectedPattern(null);
    setSelectedRecord(null);
  };

  // Determine active patient data based on mode
  const effectiveMode: PatientMode = currentUser ? 'authenticated' : patientMode;

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
      console.error('Sign-in error:', error);
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setCurrentUser(null);
      setPatientModeState('demo');
    } catch (error) {
      console.error('Sign-out error:', error);
    }
  };

  const runAnalysis = () => {
    if (records.length < 2) {
      if (effectiveMode === 'authenticated') setAuthPatterns([]);
      else if (effectiveMode === 'new_patient') setNewPatientPatterns([]);
      return;
    }
    const generated = runLongitudinalAnalysis(records, observations, patient.uid);
    if (effectiveMode === 'authenticated') {
      setAuthPatterns(generated);
    } else if (effectiveMode === 'new_patient') {
      setNewPatientPatterns(generated);
    } else {
      setDemoPatterns(generated);
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

    if (effectiveMode === 'authenticated' && currentUser) {
      setAuthRecords(updatedRecords);
      setAuthObservations(updatedObservations);
      // Persist to Firestore under isolated user scope
      try {
        const recPath = `users/${currentUser.uid}/records`;
        await setDoc(doc(db, recPath, id), fullRecord);

        for (const obs of newObservations) {
          const obsPath = `users/${currentUser.uid}/observations`;
          await setDoc(doc(db, obsPath, obs.id), obs);
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}/records/${id}`);
      }
    } else if (effectiveMode === 'new_patient') {
      setNewPatientRecords(updatedRecords);
      setNewPatientObservations(updatedObservations);
    } else {
      setDemoRecords(updatedRecords);
      setDemoObservations(updatedObservations);
    }

    // Re-evaluate patterns only when longitudinal criteria are satisfied (at least 2 records)
    if (updatedRecords.length >= 2) {
      const newPatterns = runLongitudinalAnalysis(updatedRecords, updatedObservations, patient.uid);
      if (effectiveMode === 'authenticated') setAuthPatterns(newPatterns);
      else if (effectiveMode === 'new_patient') setNewPatientPatterns(newPatterns);
      else setDemoPatterns(newPatterns);
    } else {
      // 1 record: intentional single-record state, no fabricated patterns
      if (effectiveMode === 'authenticated') setAuthPatterns([]);
      else if (effectiveMode === 'new_patient') setNewPatientPatterns([]);
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

    if (effectiveMode === 'authenticated') setAuthRecords(updateList);
    else if (effectiveMode === 'new_patient') setNewPatientRecords(updateList);
    else setDemoRecords(updateList);
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

    if (effectiveMode === 'authenticated') {
      setAuthRecords(updateList);
      if (currentUser) {
        const target = authRecords.find((r) => r.id === recordId);
        if (target && target.prescriptionDetails) {
          const updated = {
            ...target,
            prescriptionDetails: { ...target.prescriptionDetails, isTakenConfirmed: confirmed },
          };
          try {
            await setDoc(doc(db, `users/${currentUser.uid}/records`, recordId), updated);
          } catch (err) {
            console.error('Failed to update prescription intake confirmation in Firestore:', err);
          }
        }
      }
    } else if (effectiveMode === 'new_patient') {
      setNewPatientRecords(updateList);
    } else {
      setDemoRecords(updateList);
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

    if (effectiveMode === 'authenticated') setAuthRecords(updateList);
    else if (effectiveMode === 'new_patient') setNewPatientRecords(updateList);
    else setDemoRecords(updateList);
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

    if (effectiveMode === 'authenticated') {
      setAuthReviews((prev) => ({ ...prev, [patternId]: review }));
      if (currentUser) {
        try {
          const path = `users/${currentUser.uid}/reviews`;
          await setDoc(doc(db, path, review.id), review);
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}/reviews/${review.id}`);
        }
      }
    } else if (effectiveMode === 'new_patient') {
      setNewPatientReviews((prev) => ({ ...prev, [patternId]: review }));
    } else {
      setDemoReviews((prev) => ({ ...prev, [patternId]: review }));
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

    if (effectiveMode === 'authenticated') setAuthProviders(updateList);
    else if (effectiveMode === 'new_patient') setNewPatientProviders(updateList);
    else setDemoProviders(updateList);
  };

  return (
    <HealthContext.Provider
      value={{
        currentUser,
        authLoading,
        patientMode: effectiveMode,
        setPatientMode,
        resetNewPatientState,
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
