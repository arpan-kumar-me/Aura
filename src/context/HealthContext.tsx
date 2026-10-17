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

interface HealthContextType {
  currentUser: User | null;
  authLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  patient: typeof INITIAL_PATIENT;
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
  const [patient] = useState(INITIAL_PATIENT);
  const [records, setRecords] = useState<HealthRecord[]>(INITIAL_RECORDS);
  const [observations, setObservations] = useState<Observation[]>(INITIAL_OBSERVATIONS);
  const [patterns, setPatterns] = useState<PatternCandidate[]>(INITIAL_PATTERNS);
  const [reviews, setReviews] = useState<Record<string, ClinicianReview>>({});
  const [connectedProviders, setConnectedProviders] = useState<ConnectedProvider[]>(INITIAL_PROVIDERS);
  const [selectedPattern, setSelectedPattern] = useState<PatternCandidate | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<HealthRecord | null>(null);
  const [isAddRecordModalOpen, setIsAddRecordModalOpen] = useState(false);

  // Monitor Firebase Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setAuthLoading(false);

      if (user) {
        // Attempt to load user data from Firestore
        try {
          const recsPath = `users/${user.uid}/records`;
          const recSnap = await getDocs(query(collection(db, recsPath)));
          if (!recSnap.empty) {
            const loadedRecs: HealthRecord[] = [];
            recSnap.forEach((d) => loadedRecs.push(d.data() as HealthRecord));
            setRecords(loadedRecs);
          }

          const revPath = `users/${user.uid}/reviews`;
          const revSnap = await getDocs(query(collection(db, revPath)));
          if (!revSnap.empty) {
            const loadedRevs: Record<string, ClinicianReview> = {};
            revSnap.forEach((d) => {
              const r = d.data() as ClinicianReview;
              loadedRevs[r.patternId] = r;
            });
            setReviews(loadedRevs);
          }
        } catch (err) {
          console.log('Using default patient dataset for demonstration:', err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

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
    } catch (error) {
      console.error('Sign-out error:', error);
    }
  };

  const runAnalysis = () => {
    const generated = runLongitudinalAnalysis(records, observations, patient.uid);
    if (generated.length > 0) {
      setPatterns(generated);
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
      userId: currentUser?.uid || patient.uid,
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

    // Also create discrete observations from extracted facts
    const newObservations: Observation[] = facts
      .filter((f) => f.numericValue !== null)
      .map((f, idx) => ({
        id: `obs_${Date.now()}_${idx}`,
        userId: currentUser?.uid || patient.uid,
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

    // If prescription has strength or dosage, link to observations
    if (fullRecord.recordType === 'prescription' && fullRecord.prescriptionDetails) {
      const rx = fullRecord.prescriptionDetails;
      const numMatch = rx.strength ? parseFloat(rx.strength) : null;
      if (numMatch && !isNaN(numMatch)) {
        newObservations.push({
          id: `obs_${Date.now()}_rx`,
          userId: currentUser?.uid || patient.uid,
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

    setRecords(updatedRecords);
    setObservations(updatedObservations);

    // Save to Firestore if signed in
    if (currentUser) {
      try {
        const path = `users/${currentUser.uid}/records`;
        await setDoc(doc(db, path, id), fullRecord);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}/records/${id}`);
      }
    }

    // Re-evaluate pattern candidates
    const newPatterns = runLongitudinalAnalysis(updatedRecords, updatedObservations, patient.uid);
    if (newPatterns.length > 0) {
      setPatterns(newPatterns);
    }
  };

  const updateFactConfirmation = (
    recordId: string,
    factId: string,
    confirmed: boolean,
    correctedVal?: number | null
  ) => {
    setRecords((prev) =>
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
      })
    );
  };

  const updatePrescriptionIntakeConfirmation = async (recordId: string, confirmed: boolean) => {
    let targetRecord: HealthRecord | null = null;
    setRecords((prev) =>
      prev.map((rec) => {
        if (rec.id !== recordId) return rec;
        const currentRx = rec.prescriptionDetails;
        if (!currentRx) return rec;
        const updatedRx: PrescriptionDetails = {
          ...currentRx,
          isTakenConfirmed: confirmed,
        };
        const updatedRec = { ...rec, prescriptionDetails: updatedRx };
        targetRecord = updatedRec;
        return updatedRec;
      })
    );

    // Also update selectedRecord if currently viewing
    setSelectedRecord((prev) => {
      if (prev && prev.id === recordId && prev.prescriptionDetails) {
        return {
          ...prev,
          prescriptionDetails: {
            ...prev.prescriptionDetails,
            isTakenConfirmed: confirmed,
          },
        };
      }
      return prev;
    });

    if (currentUser && targetRecord) {
      try {
        const path = `users/${currentUser.uid}/records`;
        await setDoc(doc(db, path, recordId), targetRecord);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}/records/${recordId}`);
      }
    }
  };

  const updatePrescriptionDetails = async (recordId: string, details: Partial<PrescriptionDetails>) => {
    let targetRecord: HealthRecord | null = null;
    setRecords((prev) =>
      prev.map((rec) => {
        if (rec.id !== recordId) return rec;
        const currentRx = rec.prescriptionDetails;
        if (!currentRx) return rec;
        const updatedRx: PrescriptionDetails = {
          ...currentRx,
          ...details,
        };
        const updatedRec = { ...rec, prescriptionDetails: updatedRx };
        targetRecord = updatedRec;
        return updatedRec;
      })
    );

    setSelectedRecord((prev) => {
      if (prev && prev.id === recordId && prev.prescriptionDetails) {
        return {
          ...prev,
          prescriptionDetails: {
            ...prev.prescriptionDetails,
            ...details,
          },
        };
      }
      return prev;
    });

    if (currentUser && targetRecord) {
      try {
        const path = `users/${currentUser.uid}/records`;
        await setDoc(doc(db, path, recordId), targetRecord);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}/records/${recordId}`);
      }
    }
  };

  const saveClinicianReview = async (patternId: string, status: ReviewStatus, notes: string) => {
    const reviewId = `rev_${Date.now()}`;
    const reviewData: ClinicianReview = {
      id: reviewId,
      patternId,
      patientId: patient.uid,
      clinicianUid: currentUser?.uid || 'clinician_verified_dr_lin',
      clinicianName: currentUser?.displayName || 'Dr. Sarah Lin, MD',
      status,
      notes,
      reviewedAt: new Date().toISOString(),
    };

    setReviews((prev) => ({
      ...prev,
      [patternId]: reviewData,
    }));

    if (currentUser) {
      try {
        const path = `users/${currentUser.uid}/reviews`;
        await setDoc(doc(db, path, reviewId), reviewData);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}/reviews/${reviewId}`);
      }
    }
  };

  const toggleProviderStatus = (providerId: string) => {
    setConnectedProviders((prev) =>
      prev.map((prov) => {
        if (prov.id !== providerId) return prov;
        const nextStatus = prov.status === 'connected' ? 'disconnected' : 'connected';
        return {
          ...prov,
          status: nextStatus,
          lastSync: nextStatus === 'connected' ? 'Just now' : 'Disconnected',
        };
      })
    );
  };

  return (
    <HealthContext.Provider
      value={{
        currentUser,
        authLoading,
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
