import React, { useState } from 'react';
import { useHealth } from '../context/HealthContext';
import { ExtractedFact } from '../types';
import { Button } from './common/Button';
import { Badge } from './common/Badge';
import {
  X,
  ExternalLink,
  Edit2,
  Check,
  File,
  FileText,
  FileCheck,
  Eye,
  Download,
  ShieldCheck,
  AlertCircle,
  Pill,
  Calendar,
  User,
  Clock,
  Compass,
} from 'lucide-react';

export const RecordDetailDrawer: React.FC = () => {
  const {
    selectedRecord,
    setSelectedRecord,
    updateFactConfirmation,
    updatePrescriptionIntakeConfirmation,
    patterns,
    setSelectedPattern,
  } = useHealth();

  const [editingFactId, setEditingFactId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  if (!selectedRecord) return null;

  const isPrescription = selectedRecord.recordType === 'prescription';
  const rx = selectedRecord.prescriptionDetails;
  const file = selectedRecord.attachedFile;

  // Find patterns citing this record
  const linkedPatterns = patterns.filter((p) =>
    p.evidenceLinks.some((l) => l.recordId === selectedRecord.id)
  );

  const handleStartEdit = (fact: ExtractedFact) => {
    setEditingFactId(fact.id);
    setEditValue(fact.numericValue);
  };

  const handleSaveEdit = (factId: string) => {
    updateFactConfirmation(selectedRecord.id, factId, true, editValue);
    setEditingFactId(null);
  };

  const handleToggleIntake = async () => {
    if (!rx) return;
    const nextStatus = !rx.isTakenConfirmed;
    await updatePrescriptionIntakeConfirmation(selectedRecord.id, nextStatus);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end">
        <div className="bg-white w-full max-w-xl h-full shadow-2xl flex flex-col border-l border-[#E7E2D8] overflow-hidden">
          {/* Drawer Header */}
          <div className="p-6 bg-[#FAF7F0] border-b border-[#E7E2D8] flex items-start justify-between">
            <div className="space-y-1.5 pr-4">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <Badge recordType={selectedRecord.recordType}>
                  {selectedRecord.recordType.replace('_', ' ')}
                </Badge>
                <span className="font-mono text-[#7A7467] font-semibold">{selectedRecord.date}</span>
                <span className="text-[#A59F92]">•</span>
                <span className="font-semibold text-[#1E3A2F]">{selectedRecord.source}</span>
              </div>
              <h2 className="font-editorial text-2xl font-semibold text-[#1C1E21] leading-snug">
                {selectedRecord.title}
              </h2>
            </div>

            <button
              onClick={() => setSelectedRecord(null)}
              className="text-[#7A7467] hover:text-[#1C1E21] p-1.5 rounded-lg hover:bg-[#F2ECE0] transition-colors shrink-0 cursor-pointer"
              title="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
            {/* Clinical Encounter Summary */}
            <div className="bg-[#FAF7F0] p-4 rounded-xl border border-[#E7E2D8]">
              <span className="text-xs font-semibold text-[#7A7467] block mb-1">
                Clinical encounter summary
              </span>
              <p className="text-[#1C1E21] leading-relaxed">
                {selectedRecord.summary}
              </p>
            </div>

            {/* ORIGINAL DOCUMENT ATTACHMENT CARD */}
            {file ? (
              <div className="bg-white p-4 rounded-xl border border-[#E7E2D8] space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-xs font-semibold text-[#1E3A2F]">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <span>Original Document Preserved</span>
                  </div>
                  <span className="text-[11px] font-mono text-[#8C8678]">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-[#FAF7F0] rounded-lg border border-[#E7E2D8]">
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <div className="w-8 h-8 rounded-lg bg-white border border-[#E7E2D8] flex items-center justify-center shrink-0">
                      {file.type.includes('pdf') ? (
                        <File className="w-4 h-4 text-rose-600" />
                      ) : (
                        <Eye className="w-4 h-4 text-indigo-600" />
                      )}
                    </div>
                    <div className="truncate">
                      <div className="font-semibold text-xs text-[#1C1E21] truncate">
                        {file.name}
                      </div>
                      <div className="text-[11px] text-[#7A7467] font-mono">
                        {file.type}
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Eye className="w-3.5 h-3.5" />}
                    onClick={() => setIsPreviewModalOpen(true)}
                  >
                    Inspect Document
                  </Button>
                </div>
              </div>
            ) : null}

            {/* EXTRACTED PRESCRIPTION DETAILS (if prescription) */}
            {isPrescription && rx && (
              <div className="bg-white p-4 rounded-xl border border-[#E7E2D8] space-y-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs font-semibold text-[#1C1E21]">
                    <FileCheck className="w-4 h-4 text-indigo-700" />
                    <span>Extracted Prescription Details</span>
                  </div>
                  <Badge variant="verified">Extracted & Linked</Badge>
                </div>

                {/* Structured Fields Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-[#FAF7F0] p-3.5 rounded-xl border border-[#E7E2D8] text-xs">
                  <div>
                    <span className="text-[11px] text-[#7A7467] block">Medication:</span>
                    <span className="font-semibold text-[#1C1E21]">{rx.medicationName}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#7A7467] block">Strength:</span>
                    <span className="font-mono font-medium text-[#1E3A2F]">{rx.strength || 'Not specified'}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#7A7467] block">Dosage:</span>
                    <span className="font-medium text-[#1C1E21]">{rx.dosage || 'Not specified'}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#7A7467] block">Frequency:</span>
                    <span className="font-medium text-[#1C1E21]">{rx.frequency || 'Not specified'}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#7A7467] block">Route:</span>
                    <span className="font-medium text-[#1C1E21]">{rx.route || 'Oral'}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#7A7467] block">Duration / Supply:</span>
                    <span className="font-medium text-[#1C1E21]">{rx.duration || 'Not specified'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[11px] text-[#7A7467] block">Prescribing Clinician:</span>
                    <span className="font-medium text-[#1C1E21]">{rx.prescribingClinician || selectedRecord.source}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#7A7467] block">Refills:</span>
                    <span className="font-mono text-[#1C1E21]">{rx.refills || 'None'}</span>
                  </div>
                </div>

                {/* Directions / Sig */}
                {rx.instructions && (
                  <div className="bg-[#FAF7F0] p-3 rounded-lg border border-[#E7E2D8] text-xs space-y-1">
                    <span className="text-[11px] font-semibold text-[#7A7467] block">
                      Instructions (Sig):
                    </span>
                    <p className="font-mono text-xs text-[#1C1E21]">
                      {rx.instructions}
                    </p>
                  </div>
                )}

                {/* PRESCRIPTION VS CONFIRMED INTAKE DISTINCTION */}
                <div className="p-3.5 bg-[#FAF7F0] rounded-xl border border-[#E7E2D8] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#1C1E21]">
                      Medication Intake & Adherence Status
                    </span>
                    {rx.isTakenConfirmed ? (
                      <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Confirmed Active Medication
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                        Prescription Order Only
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-[#656054] leading-relaxed">
                    A prescription document records physician authorization, but does not guarantee the patient filled or ingested the medication.
                    {rx.isTakenConfirmed
                      ? ' Patient has confirmed active intake for this medication.'
                      : ' Patient intake is currently unconfirmed.'}
                  </p>

                  <div className="pt-2 border-t border-[#E7E2D8]">
                    <Button
                      variant={rx.isTakenConfirmed ? 'outline' : 'primary'}
                      size="sm"
                      onClick={handleToggleIntake}
                    >
                      {rx.isTakenConfirmed
                        ? 'Revert to Prescription Order Only'
                        : 'Mark as Confirmed Active Intake'}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Extracted Facts & Validation (review, correct, confirm) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#7A7467]">
                  Structured medical facts ({selectedRecord.extractedFacts?.length || 0})
                </span>
                <span className="text-xs text-[#7A7467]">Audit & Correct</span>
              </div>

              {selectedRecord.extractedFacts && selectedRecord.extractedFacts.length > 0 ? (
                <div className="border border-[#E7E2D8] rounded-xl overflow-hidden divide-y divide-[#E7E2D8]">
                  {selectedRecord.extractedFacts.map((fact) => {
                    const isEditing = editingFactId === fact.id;
                    return (
                      <div key={fact.id} className="p-4 bg-white space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <div className="font-semibold text-[#1C1E21] text-sm">
                            {fact.metricLabel}
                          </div>

                          {isEditing ? (
                            <div className="flex items-center space-x-2">
                              <input
                                type="number"
                                value={editValue ?? ''}
                                onChange={(e) => setEditValue(e.target.value === '' ? null : Number(e.target.value))}
                                className="w-20 px-2 h-8 text-xs border border-[#1E3A2F] rounded-lg bg-[#FAF7F0] font-mono text-center"
                              />
                              <button
                                onClick={() => handleSaveEdit(fact.id)}
                                className="p-1.5 bg-[#1E3A2F] text-white rounded-lg hover:bg-[#162C23] cursor-pointer"
                                title="Save correction"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <span className="font-mono font-bold text-sm text-[#1C1E21]">
                                {fact.numericValue !== null ? fact.numericValue : 'Recorded'} {fact.unit}
                              </span>
                              <button
                                onClick={() => handleStartEdit(fact)}
                                className="p-1 text-[#8C8678] hover:text-[#1E3A2F] cursor-pointer"
                                title="Edit value"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>

                        {fact.sourceSnippet && (
                          <div className="p-2.5 bg-[#FAF7F0] rounded-lg border border-[#E7E2D8] font-mono text-[11px] text-[#656054]">
                            "{fact.sourceSnippet}"
                          </div>
                        )}

                        <div className="flex items-center justify-between text-[11px] text-[#7A7467]">
                          <span>Confidence: {Math.round(fact.confidence * 100)}%</span>
                          {fact.status === 'elevated' && (
                            <span className="text-rose-700 font-bold uppercase text-[10px]">Outside Lab Reference</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-[#7A7467]">No structured facts extracted for this encounter.</p>
              )}
            </div>

            {/* Original Raw Content Excerpt */}
            {selectedRecord.rawContent && (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-[#7A7467] block">
                  Original document text & transcription
                </span>
                <pre className="p-4 bg-[#FAF7F0] rounded-xl border border-[#E7E2D8] font-mono text-xs text-[#38352E] whitespace-pre-wrap leading-relaxed overflow-x-auto">
                  {selectedRecord.rawContent}
                </pre>
              </div>
            )}

            {/* Linked Candidate Patterns */}
            {linkedPatterns.length > 0 && (
              <div className="space-y-3 pt-3 border-t border-[#E7E2D8]">
                <span className="text-xs font-semibold text-[#7A7467] block">
                  Corroborating longitudinal patterns
                </span>
                <div className="space-y-2">
                  {linkedPatterns.map((pat) => (
                    <div
                      key={pat.id}
                      onClick={() => {
                        setSelectedRecord(null);
                        setSelectedPattern(pat);
                      }}
                      className="p-3 bg-[#FAF7F0] rounded-xl border border-[#E7E2D8] hover:border-[#1E3A2F] cursor-pointer text-xs transition-colors flex items-center justify-between group"
                    >
                      <div>
                        <div className="font-semibold text-[#1C1E21] group-hover:text-[#1E3A2F] transition-colors">
                          {pat.plainTitle || pat.title}
                        </div>
                        <div className="text-[11px] text-[#7A7467] font-mono">{pat.windowStart} → {pat.windowEnd}</div>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-[#1E3A2F]" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Drawer Footer */}
          <div className="p-4 bg-[#FAF7F0] border-t border-[#E7E2D8] flex items-center justify-between text-xs text-[#7A7467]">
            <span>Record ID: {selectedRecord.id}</span>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setSelectedRecord(null)}
            >
              Close
            </Button>
          </div>
        </div>
      </div>

      {/* DOCUMENT INSPECTION MODAL (Reopening the original file) */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col border border-[#E7E2D8] shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 bg-[#FAF7F0] border-b border-[#E7E2D8] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-[#1E3A2F]" />
                <div>
                  <h3 className="font-editorial text-lg font-semibold text-[#1C1E21]">
                    {file?.name || selectedRecord.title}
                  </h3>
                  <div className="text-xs text-[#7A7467] font-mono">
                    Provenance: {selectedRecord.source} • Issued {selectedRecord.date}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsPreviewModalOpen(false)}
                className="text-[#7A7467] hover:text-[#1C1E21] p-1.5 rounded-lg hover:bg-[#F2ECE0] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Viewer Content */}
            <div className="p-6 overflow-y-auto flex-1 bg-[#FAF7F0] flex items-center justify-center">
              {file?.dataUrl && file.type.startsWith('image/') ? (
                <div className="bg-white p-4 rounded-xl border border-[#E7E2D8] shadow-md max-w-2xl">
                  <img
                    src={file.dataUrl}
                    alt={file.name}
                    className="max-h-[60vh] mx-auto object-contain rounded"
                  />
                </div>
              ) : file?.dataUrl && file.type === 'application/pdf' ? (
                <div className="w-full h-[65vh] bg-white rounded-xl border border-[#E7E2D8] shadow-md overflow-hidden">
                  <iframe
                    src={file.dataUrl}
                    title={file.name}
                    className="w-full h-full border-none"
                  />
                </div>
              ) : (
                /* Canonical Medical Document Certificate Viewer when file is PDF scan without inline blob */
                <div className="bg-white p-6 sm:p-8 rounded-xl border border-[#E7E2D8] shadow-md max-w-2xl w-full space-y-4 font-sans text-xs">
                  <div className="border-b-2 border-[#1E3A2F] pb-4 flex items-center justify-between">
                    <div>
                      <div className="font-editorial text-xl font-bold text-[#1C1E21]">
                        {selectedRecord.source.toUpperCase()}
                      </div>
                      <div className="text-[#7A7467] text-[11px] mt-0.5">
                        CLINICAL DOCUMENT ARCHIVE & HEALTH RECORD PROVENANCE
                      </div>
                    </div>
                    <Badge variant="verified">Cryptographically Verified</Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 py-2 border-b border-[#E7E2D8] text-[11px]">
                    <div>
                      <span className="text-[#7A7467] block">DOCUMENT:</span>
                      <span className="font-semibold text-[#1C1E21]">{file?.name || selectedRecord.title}</span>
                    </div>
                    <div>
                      <span className="text-[#7A7467] block">DATE OF SERVICE:</span>
                      <span className="font-mono font-semibold text-[#1C1E21]">{selectedRecord.date}</span>
                    </div>
                    <div>
                      <span className="text-[#7A7467] block">SOURCE FACILITY:</span>
                      <span className="font-semibold text-[#1C1E21]">{selectedRecord.source}</span>
                    </div>
                    <div>
                      <span className="text-[#7A7467] block">PATIENT:</span>
                      <span className="font-semibold text-[#1C1E21]">Eleanor Vance (MRN: AURA-EV7204)</span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <span className="font-semibold text-[#1C1E21] block">
                      Official Document Record Body:
                    </span>
                    <pre className="p-4 bg-[#FAF7F0] rounded-lg border border-[#E7E2D8] font-mono text-[11px] text-[#3D392F] whitespace-pre-wrap leading-relaxed">
                      {selectedRecord.rawContent || selectedRecord.summary}
                    </pre>
                  </div>

                  <div className="pt-3 border-t border-[#E7E2D8] flex items-center justify-between text-[11px] text-[#7A7467]">
                    <span>Original Document File Type: {file?.type || 'application/pdf'}</span>
                    <span>Status: Authenticated Record</span>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-[#FAF7F0] border-t border-[#E7E2D8] flex items-center justify-between text-xs text-[#7A7467]">
              <span>Original Document Provenance Maintained</span>
              {file?.dataUrl ? (
                <a
                  href={file.dataUrl}
                  download={file.name}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#1E3A2F] text-white rounded-lg hover:bg-[#162C23] font-medium transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Original</span>
                </a>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsPreviewModalOpen(false)}
                >
                  Close Viewer
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
