import React, { useState, useRef } from 'react';
import { useHealth } from '../context/HealthContext';
import { RecordType, ExtractedFact, PrescriptionDetails, AttachedFile } from '../types';
import { Button } from './common/Button';
import { Badge } from './common/Badge';
import {
  X,
  Sparkles,
  CheckCircle2,
  Trash2,
  ShieldCheck,
  FileCheck,
  Activity,
  FileText,
  FileQuestion,
  Upload,
  File,
  AlertCircle,
  Eye,
  RefreshCw,
} from 'lucide-react';

const SAMPLE_DOCS = [
  {
    title: 'Dr. Sarah Lin — Atorvastatin 40mg Prescription',
    type: 'prescription' as RecordType,
    source: 'Mount Sinai Heart Health',
    date: '2025-08-14',
    text: `MOUNT SINAI MEDICAL CENTER — DEPARTMENT OF CARDIOLOGY
Prescriber: Dr. Sarah Lin, MD (NPI: 1849204821)
Date of Issue: 2025-08-14
Patient: Eleanor Vance (DOB: 1974-04-12)

Rx: Atorvastatin Calcium 40 mg Oral Tablet
Dispense: #90 (Ninety) tablets
Sig: Take 1 tablet by mouth daily at bedtime with water for hyperlipidemia.
Refills: 2 (Two)
Duration: 90 days supply
Pharmacy: Mount Sinai Outpatient Pharmacy
Substitution Permitted: Yes`,
    rxDetails: {
      medicationName: 'Atorvastatin Calcium',
      strength: '40 mg',
      dosage: '1 tablet',
      frequency: 'Once daily at bedtime',
      route: 'Oral',
      duration: '90 days',
      prescribingClinician: 'Dr. Sarah Lin, MD',
      prescriptionDate: '2025-08-14',
      refills: '2',
      instructions: 'Take 1 tablet by mouth daily at bedtime with water for hyperlipidemia.',
      isTakenConfirmed: false,
    },
  },
  {
    title: 'LabCorp Comprehensive Metabolic & CPK Panel',
    type: 'lab_report' as RecordType,
    source: 'LabCorp Clinical Services',
    date: '2026-09-18',
    text: `SPECIMEN: Fasting Serum / LabCorp Reference
Patient: Eleanor Vance
Creatine Kinase (CPK): 285 U/L [Ref: 30-145] (High)
AST (SGOT): 38 U/L [Ref: 10-35] (Mildly High)
ALT (SGPT): 31 U/L [Ref: 7-35] (Normal)
Total Cholesterol: 172 mg/dL [Ref: <200] (Normal)
LDL Cholesterol: 96 mg/dL [Ref: <100] (Optimal)
Triglycerides: 125 mg/dL [Ref: <150] (Normal)`,
  },
  {
    title: 'Clinical Encounter: Muscle Soreness Review',
    type: 'clinical_note' as RecordType,
    source: 'Mount Sinai Clinic',
    date: '2026-09-22',
    text: `Cardiology Follow-Up Note
Patient seen for review of persistent proximal lower extremity soreness following statin therapy.
Subjective: Patient notes heaviness and aching in bilateral quadriceps starting ~6-8 days after Atorvastatin dosage adjustments.
Physical Exam: Full strength 5/5 bilateral hip flexors and knee extensors. No erythema or localized edema.
Assessment: Statin-associated muscle symptoms (SAMS) suspected given timing and documented CPK elevation to 285 U/L.
Plan: Trial CoQ10 200mg daily. Discussed potential switch to alternate-day Rosuvastatin 5mg if myalgia persists.`,
  },
];

const RECORD_TYPE_CONFIG: {
  type: RecordType;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    type: 'prescription',
    label: 'Prescription',
    description: 'Rx orders, script slips, and e-prescriptions',
    icon: <FileCheck className="w-4 h-4 text-indigo-700" />,
  },
  {
    type: 'lab_report',
    label: 'Laboratory Report',
    description: 'Blood work, biomarker panels, and pathology',
    icon: <Activity className="w-4 h-4 text-emerald-700" />,
  },
  {
    type: 'clinical_note',
    label: 'Clinical Note',
    description: 'Physician encounter summaries and consult notes',
    icon: <FileText className="w-4 h-4 text-amber-700" />,
  },
  {
    type: 'other_document',
    label: 'Other Medical Document',
    description: 'Imaging reports, discharge papers, or medical letters',
    icon: <FileQuestion className="w-4 h-4 text-stone-600" />,
  },
];

export const AddRecordModal: React.FC = () => {
  const { isAddRecordModalOpen, setIsAddRecordModalOpen, addRecord, initialRecordType } = useHealth();

  const [step, setStep] = useState<'input' | 'review'>('input');
  const [docType, setDocType] = useState<RecordType>(initialRecordType || 'prescription');
  const [docTitle, setDocTitle] = useState('');
  const [docSource, setDocSource] = useState('Mount Sinai Clinic');
  const [docDate, setDocDate] = useState(new Date().toISOString().split('T')[0]);
  const [docText, setDocText] = useState('');

  React.useEffect(() => {
    if (isAddRecordModalOpen && initialRecordType) {
      setDocType(initialRecordType);
    }
  }, [isAddRecordModalOpen, initialRecordType]);

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<AttachedFile | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Extracted fields for human review (FR-02)
  const [extractedSummary, setExtractedSummary] = useState('');
  const [extractedFacts, setExtractedFacts] = useState<ExtractedFact[]>([]);
  const [prescriptionFields, setPrescriptionFields] = useState<PrescriptionDetails>({
    medicationName: '',
    strength: '',
    dosage: '',
    frequency: '',
    route: '',
    duration: '',
    prescribingClinician: '',
    prescriptionDate: '',
    refills: '',
    instructions: '',
    isTakenConfirmed: false,
  });

  if (!isAddRecordModalOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type: PDF, JPG, JPEG, PNG
    const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setFileError('Unsupported file type. Please upload a PDF, JPG, JPEG, or PNG document.');
      return;
    }

    // Validate size: max 10MB
    if (file.size > 10 * 1024 * 1024) {
      setFileError('File size exceeds 10MB limit. Please upload a smaller scan or PDF.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setSelectedFile({
        name: file.name,
        type: file.type,
        size: file.size,
        dataUrl,
        uploadedAt: new Date().toISOString(),
      });

      if (!docTitle) {
        setDocTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
      }
    };
    reader.onerror = () => {
      setFileError('Failed to read file from local disk. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleLoadSample = (sample: typeof SAMPLE_DOCS[0]) => {
    setDocTitle(sample.title);
    setDocType(sample.type);
    setDocSource(sample.source);
    setDocDate(sample.date);
    setDocText(sample.text);
    setSelectedFile(null);
    setFileError(null);
  };

  const handleRunExtraction = async () => {
    if (!docText.trim() && !selectedFile) {
      setFileError('Please select a document file or enter document text to process.');
      return;
    }

    setFileError(null);
    setIsUploading(true);
    setUploadProgress(20);
    setProcessingStatus('Uploading document securely...');

    try {
      const progressTimer = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 80) {
            clearInterval(progressTimer);
            return 85;
          }
          return prev + 15;
        });
      }, 350);

      setProcessingStatus('Analyzing document layout & extracting prescription details with Gemini...');

      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentText: docText,
          documentTitle: docTitle,
          dateHint: docDate,
          recordType: docType,
          fileData: selectedFile?.dataUrl,
          fileType: selectedFile?.type,
          fileName: selectedFile?.name,
        }),
      });

      clearInterval(progressTimer);
      setUploadProgress(100);

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Server returned error (${res.status})`);
      }

      const json = await res.json();
      if (json.data) {
        setExtractedSummary(json.data.summary || 'Extracted medical document content.');
        if (json.data.encounterDate) {
          setDocDate(json.data.encounterDate);
        }
        if (json.data.documentType && ['prescription', 'lab_report', 'clinical_note', 'other_document', 'medication', 'symptom'].includes(json.data.documentType)) {
          setDocType(json.data.documentType as RecordType);
        }

        // Handle prescription extraction fields
        if (json.data.prescriptionDetails) {
          const rx = json.data.prescriptionDetails;
          setPrescriptionFields({
            medicationName: rx.medicationName || '',
            strength: rx.strength || '',
            dosage: rx.dosage || '',
            frequency: rx.frequency || '',
            route: rx.route || '',
            duration: rx.duration || '',
            prescribingClinician: rx.prescribingClinician || '',
            prescriptionDate: rx.prescriptionDate || docDate,
            refills: rx.refills || '',
            instructions: rx.instructions || '',
            isTakenConfirmed: false, // Default: prescription issued, distinct from confirmed adherence
          });
        } else if (docType === 'prescription') {
          // Initialize empty editable prescription fields
          setPrescriptionFields({
            medicationName: docTitle.replace(/prescription/i, '').trim() || 'Prescribed Medication',
            strength: '',
            dosage: '',
            frequency: '',
            route: 'Oral',
            duration: '',
            prescribingClinician: docSource || '',
            prescriptionDate: docDate,
            refills: '',
            instructions: docText.slice(0, 150),
            isTakenConfirmed: false,
          });
        }

        const facts: ExtractedFact[] = (json.data.extractedObservations || []).map((obs: any, idx: number) => ({
          id: `fact_${Date.now()}_${idx}`,
          metricKey: obs.metricKey || 'observation',
          metricLabel: obs.metricLabel || 'Observation',
          numericValue: obs.numericValue ?? null,
          unit: obs.unit || '',
          referenceLow: obs.referenceLow,
          referenceHigh: obs.referenceHigh,
          status: obs.status || 'recorded',
          confidence: obs.confidence || 0.95,
          requiresConfirmation: obs.requiresConfirmation ?? false,
          sourceSnippet: obs.sourceSnippet || '',
        }));

        setExtractedFacts(facts);
        setStep('review');
      }
    } catch (err: any) {
      console.error('Extraction failed:', err);
      setFileError(err.message || 'Processing failed. Please check the document format and try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setProcessingStatus('');
    }
  };

  const handleConfirmAndSave = async () => {
    await addRecord(
      {
        title: docTitle || (docType === 'prescription' ? `Prescription: ${prescriptionFields.medicationName || 'Medication'}` : 'Medical Document'),
        recordType: docType,
        source: docSource,
        date: docDate,
        summary: extractedSummary,
        rawContent: docText,
        attachedFile: selectedFile || undefined,
        prescriptionDetails: docType === 'prescription' ? prescriptionFields : undefined,
      },
      extractedFacts,
      docType === 'prescription' ? prescriptionFields : undefined,
      selectedFile || undefined
    );

    setIsAddRecordModalOpen(false);
    // Reset modal
    setStep('input');
    setDocText('');
    setDocTitle('');
    setSelectedFile(null);
    setFileError(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col border border-[#E7E2D8] shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 bg-[#FAF7F0] border-b border-[#E7E2D8] flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2 text-xs text-[#7A7467]">
              <span>{step === 'input' ? 'Step 1: Document Entry & Upload' : 'Step 2: Fact & Prescription Review'}</span>
            </div>
            <h2 className="font-editorial text-xl sm:text-2xl font-semibold text-[#1C1E21] mt-0.5">
              {step === 'input' ? 'Add Medical Record or Prescription' : 'Review Extracted Medical Information'}
            </h2>
          </div>

          <button
            onClick={() => setIsAddRecordModalOpen(false)}
            className="text-[#7A7467] hover:text-[#1C1E21] p-1.5 rounded-lg hover:bg-[#F2ECE0] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {step === 'input' ? (
            <div className="space-y-5">
              {/* Record Type Selection */}
              <div>
                <label className="block text-xs font-semibold text-[#4A453A] mb-2">
                  Select Record Type
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {RECORD_TYPE_CONFIG.map((opt) => {
                    const isSelected = docType === opt.type;
                    return (
                      <div
                        key={opt.type}
                        onClick={() => setDocType(opt.type)}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-start space-x-3 ${
                          isSelected
                            ? 'bg-[#FAF7F0] border-[#1E3A2F] ring-1 ring-[#1E3A2F]'
                            : 'bg-white border-[#E7E2D8] hover:border-[#D5CFC2]'
                        }`}
                      >
                        <div className="w-7 h-7 rounded-lg bg-white border border-[#E7E2D8] flex items-center justify-center shrink-0 mt-0.5">
                          {opt.icon}
                        </div>
                        <div>
                          <div className="font-semibold text-xs text-[#1C1E21]">{opt.label}</div>
                          <div className="text-[11px] text-[#7A7467] mt-0.5 leading-snug">{opt.description}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* File Upload Zone (PDF, JPG, JPEG, PNG) */}
              <div>
                <label className="block text-xs font-semibold text-[#4A453A] mb-1.5">
                  {docType === 'prescription' ? 'Upload Prescription File (PDF, JPG, PNG)' : 'Upload Document Scan or File (PDF, JPG, PNG)'}
                </label>

                {!selectedFile ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-[#D5CFC2] hover:border-[#1E3A2F] bg-[#FAF7F0] hover:bg-[#F4EFE6] rounded-xl p-6 text-center cursor-pointer transition-colors"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,image/jpeg,image/png,application/pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <Upload className="w-8 h-8 text-[#1E3A2F] mx-auto mb-2 opacity-80" />
                    <p className="text-xs font-semibold text-[#1C1E21]">
                      Click to choose prescription file or drag & drop here
                    </p>
                    <p className="text-[11px] text-[#7A7467] mt-1">
                      Supports PDF, PNG, JPG, JPEG up to 10MB • Keeps document private
                    </p>
                  </div>
                ) : (
                  /* File Selected Preview Card */
                  <div className="bg-[#FAF7F0] p-4 rounded-xl border border-[#E7E2D8] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 overflow-hidden">
                        <div className="w-9 h-9 rounded-lg bg-white border border-[#E7E2D8] flex items-center justify-center shrink-0">
                          {selectedFile.type.includes('pdf') ? (
                            <File className="w-5 h-5 text-rose-600" />
                          ) : (
                            <Eye className="w-5 h-5 text-indigo-600" />
                          )}
                        </div>
                        <div className="truncate">
                          <div className="font-semibold text-xs text-[#1C1E21] truncate">
                            {selectedFile.name}
                          </div>
                          <div className="text-[11px] text-[#7A7467] font-mono mt-0.5">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • {selectedFile.type}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<RefreshCw className="w-3.5 h-3.5" />}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          Replace
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          icon={<Trash2 className="w-3.5 h-3.5" />}
                          onClick={handleRemoveFile}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>

                    {/* Image Preview Thumbnail if an image */}
                    {selectedFile.type.startsWith('image/') && selectedFile.dataUrl && (
                      <div className="pt-2 border-t border-[#E7E2D8] flex justify-center">
                        <img
                          src={selectedFile.dataUrl}
                          alt="Prescription preview"
                          className="max-h-48 rounded-lg border border-[#E7E2D8] object-contain bg-white"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Actionable Error Banner */}
              {fileError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">{fileError}</div>
                </div>
              )}

              {/* Preloaded Quick-Try Samples */}
              <div className="bg-[#FAF7F0] p-4 rounded-xl border border-[#E7E2D8] space-y-2">
                <span className="text-xs font-semibold text-[#7A7467] block">
                  Or load a preformatted clinical example
                </span>
                <div className="flex flex-wrap gap-2">
                  {SAMPLE_DOCS.map((sample, i) => (
                    <button
                      key={i}
                      onClick={() => handleLoadSample(sample)}
                      className="px-3 h-8 text-xs font-medium text-[#1E3A2F] bg-white border border-[#E7E2D8] hover:bg-[#FAF7F0] rounded-lg transition-colors cursor-pointer text-left"
                    >
                      {sample.title}
                    </button>
                  ))}
                </div>
              </div>

              {/* Form Metadata Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#4A453A] mb-1">
                    Record Title
                  </label>
                  <input
                    type="text"
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    placeholder={docType === 'prescription' ? 'e.g. Atorvastatin 40mg Script' : 'e.g. Lipid Panel LabCorp'}
                    className="w-full px-3 h-9 text-xs bg-white border border-[#D5CFC2] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1E3A2F] text-[#1C1E21]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#4A453A] mb-1">
                    Encounter / Issue Date
                  </label>
                  <input
                    type="date"
                    value={docDate}
                    onChange={(e) => setDocDate(e.target.value)}
                    className="w-full px-3 h-9 text-xs bg-white border border-[#D5CFC2] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1E3A2F] text-[#1C1E21]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#4A453A] mb-1">
                    Source / Clinic / Pharmacy
                  </label>
                  <input
                    type="text"
                    value={docSource}
                    onChange={(e) => setDocSource(e.target.value)}
                    placeholder="e.g. Mount Sinai Clinic, Quest"
                    className="w-full px-3 h-9 text-xs bg-white border border-[#D5CFC2] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1E3A2F] text-[#1C1E21]"
                  />
                </div>
              </div>

              {/* Optional Text Content if user prefers typing */}
              <div>
                <label className="block text-xs font-medium text-[#4A453A] mb-1">
                  Document Text / Notes (Optional if file is uploaded)
                </label>
                <textarea
                  rows={4}
                  value={docText}
                  onChange={(e) => setDocText(e.target.value)}
                  placeholder="Paste prescription directions (Sig), doctor notes, or leave blank if uploading an image/PDF scan..."
                  className="w-full p-3 font-mono text-xs bg-[#FAF7F0] border border-[#D5CFC2] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#1E3A2F] text-[#1C1E21]"
                />
              </div>

              <div className="p-3.5 bg-[#FAF7F0] border border-[#E7E2D8] rounded-xl text-xs text-[#656054] flex items-center space-x-2.5">
                <ShieldCheck className="w-4 h-4 text-[#1E3A2F] shrink-0" />
                <span>
                  Prescriptions are processed with multimodal clinical layout understanding. Missing details are left unknown and never fabricated.
                </span>
              </div>
            </div>
          ) : (
            /* STEP 2: Review & Confirm Extracted Facts (FR-02) */
            <div className="space-y-6">
              {/* Extraction Success Notice */}
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1">
                <div className="flex items-center space-x-1.5 text-emerald-900 font-semibold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>
                    Extraction Complete — {docType === 'prescription' ? 'Prescription Fields Detected' : `${extractedFacts.length} Candidate Facts Identified`}
                  </span>
                </div>
                <p className="text-xs text-emerald-950 leading-relaxed">{extractedSummary}</p>
              </div>

              {/* Attached file summary badge if present */}
              {selectedFile && (
                <div className="p-3 bg-[#FAF7F0] rounded-xl border border-[#E7E2D8] flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <File className="w-4 h-4 text-[#1E3A2F]" />
                    <span className="font-semibold text-[#1C1E21]">Original File Attached:</span>
                    <span className="font-mono text-[#7A7467]">{selectedFile.name}</span>
                  </div>
                  <Badge variant="verified">Preserved</Badge>
                </div>
              )}

              {/* PRESCRIPTION EDITABLE FIELDS (If Prescription) */}
              {docType === 'prescription' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#7A7467]">
                      Extracted Prescription Details (Review & Edit)
                    </span>
                    <span className="text-xs text-[#7A7467]">
                      Fields without explicit evidence are left unknown
                    </span>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-[#E7E2D8] space-y-4 text-xs">
                    {/* Row 1: Medication Name & Strength */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-[#1C1E21] mb-1">
                          Medication Name *
                        </label>
                        <input
                          type="text"
                          value={prescriptionFields.medicationName}
                          onChange={(e) => setPrescriptionFields({ ...prescriptionFields, medicationName: e.target.value })}
                          placeholder="e.g. Atorvastatin Calcium"
                          className="w-full px-3 h-9 text-xs bg-[#FAF7F0] border border-[#D5CFC2] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1E3A2F] text-[#1C1E21] font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#1C1E21] mb-1">
                          Strength & Unit
                        </label>
                        <input
                          type="text"
                          value={prescriptionFields.strength || ''}
                          onChange={(e) => setPrescriptionFields({ ...prescriptionFields, strength: e.target.value || null })}
                          placeholder="e.g. 40 mg (or leave empty if unknown)"
                          className="w-full px-3 h-9 text-xs bg-[#FAF7F0] border border-[#D5CFC2] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1E3A2F] text-[#1C1E21]"
                        />
                      </div>
                    </div>

                    {/* Row 2: Dosage, Frequency, Route */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-[#4A453A] mb-1">
                          Dosage / Form
                        </label>
                        <input
                          type="text"
                          value={prescriptionFields.dosage || ''}
                          onChange={(e) => setPrescriptionFields({ ...prescriptionFields, dosage: e.target.value || null })}
                          placeholder="e.g. 1 tablet"
                          className="w-full px-3 h-9 text-xs bg-[#FAF7F0] border border-[#D5CFC2] rounded-lg focus:outline-none text-[#1C1E21]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[#4A453A] mb-1">
                          Frequency
                        </label>
                        <input
                          type="text"
                          value={prescriptionFields.frequency || ''}
                          onChange={(e) => setPrescriptionFields({ ...prescriptionFields, frequency: e.target.value || null })}
                          placeholder="e.g. Once daily at bedtime"
                          className="w-full px-3 h-9 text-xs bg-[#FAF7F0] border border-[#D5CFC2] rounded-lg focus:outline-none text-[#1C1E21]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[#4A453A] mb-1">
                          Route
                        </label>
                        <input
                          type="text"
                          value={prescriptionFields.route || ''}
                          onChange={(e) => setPrescriptionFields({ ...prescriptionFields, route: e.target.value || null })}
                          placeholder="e.g. Oral, Topical"
                          className="w-full px-3 h-9 text-xs bg-[#FAF7F0] border border-[#D5CFC2] rounded-lg focus:outline-none text-[#1C1E21]"
                        />
                      </div>
                    </div>

                    {/* Row 3: Prescriber, Date, Duration, Refills */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-[#4A453A] mb-1">
                          Prescribing Clinician
                        </label>
                        <input
                          type="text"
                          value={prescriptionFields.prescribingClinician || ''}
                          onChange={(e) => setPrescriptionFields({ ...prescriptionFields, prescribingClinician: e.target.value || null })}
                          placeholder="e.g. Dr. Sarah Lin, MD"
                          className="w-full px-3 h-9 text-xs bg-[#FAF7F0] border border-[#D5CFC2] rounded-lg focus:outline-none text-[#1C1E21]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[#4A453A] mb-1">
                          Prescription Date
                        </label>
                        <input
                          type="date"
                          value={prescriptionFields.prescriptionDate || docDate}
                          onChange={(e) => setPrescriptionFields({ ...prescriptionFields, prescriptionDate: e.target.value })}
                          className="w-full px-3 h-9 text-xs bg-[#FAF7F0] border border-[#D5CFC2] rounded-lg focus:outline-none text-[#1C1E21]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[#4A453A] mb-1">
                          Duration / Days Supply
                        </label>
                        <input
                          type="text"
                          value={prescriptionFields.duration || ''}
                          onChange={(e) => setPrescriptionFields({ ...prescriptionFields, duration: e.target.value || null })}
                          placeholder="e.g. 90 days"
                          className="w-full px-3 h-9 text-xs bg-[#FAF7F0] border border-[#D5CFC2] rounded-lg focus:outline-none text-[#1C1E21]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[#4A453A] mb-1">
                          Refills Authorized
                        </label>
                        <input
                          type="text"
                          value={prescriptionFields.refills || ''}
                          onChange={(e) => setPrescriptionFields({ ...prescriptionFields, refills: e.target.value || null })}
                          placeholder="e.g. 2 refills"
                          className="w-full px-3 h-9 text-xs bg-[#FAF7F0] border border-[#D5CFC2] rounded-lg focus:outline-none text-[#1C1E21]"
                        />
                      </div>
                    </div>

                    {/* Instructions / Sig */}
                    <div>
                      <label className="block text-xs font-medium text-[#4A453A] mb-1">
                        Instructions / Sig Directions
                      </label>
                      <textarea
                        rows={2}
                        value={prescriptionFields.instructions || ''}
                        onChange={(e) => setPrescriptionFields({ ...prescriptionFields, instructions: e.target.value || null })}
                        placeholder="e.g. Take 1 tablet by mouth daily at bedtime with water."
                        className="w-full p-2.5 text-xs bg-[#FAF7F0] border border-[#D5CFC2] rounded-lg focus:outline-none text-[#1C1E21]"
                      />
                    </div>

                    {/* Prescription Document vs Confirmed Intake Distinction */}
                    <div className="pt-3 border-t border-[#E7E2D8] bg-[#FAF7F0] p-3.5 rounded-xl border border-[#E7E2D8] space-y-2">
                      <div className="font-semibold text-[#1C1E21] text-xs">
                        Adherence & Intake Status
                      </div>
                      <div className="space-y-1.5">
                        <label className="flex items-center space-x-2.5 cursor-pointer">
                          <input
                            type="radio"
                            name="intakeStatus"
                            checked={!prescriptionFields.isTakenConfirmed}
                            onChange={() => setPrescriptionFields({ ...prescriptionFields, isTakenConfirmed: false })}
                            className="text-[#1E3A2F] focus:ring-[#1E3A2F]"
                          />
                          <span className="text-xs text-[#3D392F]">
                            <strong>Prescription order only</strong> (document authorization; patient intake not yet confirmed)
                          </span>
                        </label>
                        <label className="flex items-center space-x-2.5 cursor-pointer">
                          <input
                            type="radio"
                            name="intakeStatus"
                            checked={Boolean(prescriptionFields.isTakenConfirmed)}
                            onChange={() => setPrescriptionFields({ ...prescriptionFields, isTakenConfirmed: true })}
                            className="text-[#1E3A2F] focus:ring-[#1E3A2F]"
                          />
                          <span className="text-xs text-[#3D392F]">
                            <strong>Confirmed active medication</strong> (patient has filled and started taking this medication)
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Structured facts list (if lab report or clinical note facts exist) */}
              {extractedFacts.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#7A7467]">
                      Associated Clinical Observations ({extractedFacts.length})
                    </span>
                    <span className="text-xs text-[#7A7467]">Verify before saving</span>
                  </div>

                  <div className="border border-[#E7E2D8] rounded-xl overflow-hidden divide-y divide-[#E7E2D8]">
                    {extractedFacts.map((fact) => (
                      <div key={fact.id} className="p-3.5 bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
                        <div className="space-y-0.5 flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-[#1C1E21]">{fact.metricLabel}</span>
                            <span className="text-[#8C8678] font-mono text-[11px]">({fact.metricKey})</span>
                            <span className="text-[10px] text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded font-mono font-medium">
                              {Math.round(fact.confidence * 100)}% conf
                            </span>
                          </div>
                          {fact.sourceSnippet && (
                            <div className="text-[11px] text-[#7A7467] font-mono italic">
                              "{fact.sourceSnippet}"
                            </div>
                          )}
                        </div>

                        <div className="flex items-center space-x-2 shrink-0">
                          <input
                            type="number"
                            value={fact.numericValue ?? ''}
                            onChange={(e) => {
                              const val = e.target.value === '' ? null : Number(e.target.value);
                              setExtractedFacts((prev) =>
                                prev.map((f) => (f.id === fact.id ? { ...f, numericValue: val } : f))
                              );
                            }}
                            className="w-20 px-2 h-8 text-xs font-mono font-bold border border-[#D5CFC2] rounded-lg text-center bg-[#FAF7F0]"
                            placeholder="Value"
                          />
                          <span className="text-xs font-mono text-[#656054] w-12">{fact.unit}</span>
                          <button
                            onClick={() => setExtractedFacts((prev) => prev.filter((f) => f.id !== fact.id))}
                            className="p-1.5 text-[#8C8678] hover:text-rose-700 transition-colors cursor-pointer"
                            title="Reject this field"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-[#FAF7F0] border-t border-[#E7E2D8] flex items-center justify-between">
          {step === 'input' ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsAddRecordModalOpen(false)}
              >
                Cancel
              </Button>

              <div className="flex items-center space-x-3">
                {isUploading && (
                  <div className="flex items-center space-x-2 text-xs text-[#1E3A2F]">
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>{processingStatus || `Processing ${uploadProgress}%...`}</span>
                  </div>
                )}
                <Button
                  variant="primary"
                  size="md"
                  disabled={(!docText.trim() && !selectedFile) || isUploading}
                  icon={<Sparkles className="w-4 h-4 text-emerald-300" />}
                  onClick={handleRunExtraction}
                >
                  {isUploading ? 'Extracting...' : 'Upload & Extract Record'}
                </Button>
              </div>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep('input')}
              >
                ← Back to Edit
              </Button>
              <Button
                variant="primary"
                size="md"
                icon={<CheckCircle2 className="w-4 h-4 text-emerald-300" />}
                onClick={handleConfirmAndSave}
              >
                Confirm & Add to Records
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
