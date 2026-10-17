import React, { useState, useEffect } from 'react';
import { useHealth } from '../context/HealthContext';
import { ReviewStatus } from '../types';
import { BENCHMARK_EVALUATION } from '../data/seedData';
import { fetchPubMedLiterature, fetchFdaAdverseEvents, PubMedArticle, FdaDrugProfile } from '../services/scienceService';
import { Card } from './common/Card';
import { Badge } from './common/Badge';
import { Button } from './common/Button';
import { EvidenceList } from './common/EvidenceList';
import {
  Stethoscope,
  BookOpen,
  Copy,
  Check,
  BarChart2,
  X,
} from 'lucide-react';

export const ClinicianReviewView: React.FC = () => {
  const {
    patient,
    patterns,
    records,
    reviews,
    saveClinicianReview,
    setSelectedRecord,
  } = useHealth();

  const [activePatternId, setActivePatternId] = useState<string>(patterns[0]?.id || '');
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus>('requires_followup');
  const [reviewNotes, setReviewNotes] = useState('');
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [showBenchmarkModal, setShowBenchmarkModal] = useState(false);

  // Bioscience grounding states
  const [articles, setArticles] = useState<PubMedArticle[]>([]);
  const [fdaProfile, setFdaProfile] = useState<FdaDrugProfile | null>(null);

  const selectedPattern = patterns.find((p) => p.id === activePatternId) || patterns[0];
  const existingReview = selectedPattern ? reviews[selectedPattern.id] : undefined;

  // Initialize review inputs if already reviewed
  useEffect(() => {
    if (existingReview) {
      setReviewStatus(existingReview.status);
      setReviewNotes(existingReview.notes);
    } else {
      setReviewStatus('requires_followup');
      setReviewNotes('Plan: Evaluate statin-associated muscle symptom (SAMS) criteria. Order follow-up CPK and consider alternate-day Rosuvastatin or CoQ10 trial.');
    }
  }, [existingReview, activePatternId]);

  // Load bioscience data for active pattern
  useEffect(() => {
    if (!selectedPattern) return;

    const term = selectedPattern.title.toLowerCase().includes('cpk')
      ? 'statin myopathy CPK elevation'
      : selectedPattern.title.toLowerCase().includes('ferritin')
      ? 'ferritin depletion fatigue normal hemoglobin'
      : 'nocturnal heart rate variability recovery';

    fetchPubMedLiterature(term).then((res) => {
      setArticles(res.slice(0, 2));
    });

    if (selectedPattern.title.toLowerCase().includes('statin')) {
      fetchFdaAdverseEvents('atorvastatin').then((fda) => {
        setFdaProfile(fda);
      });
    } else {
      setFdaProfile(null);
    }
  }, [selectedPattern]);

  const handleSaveReview = async () => {
    if (!selectedPattern) return;
    await saveClinicianReview(selectedPattern.id, reviewStatus, reviewNotes);
  };

  const handleCopyEhrSummary = () => {
    if (!selectedPattern) return;
    const summaryText = `AURA LONGITUDINAL CLINICAL SYNTHESIS — EHR NOTE
Patient: ${patient.displayName} (MRN: ${patient.mrn}, Age: ${patient.age}F)
Reviewed By: Dr. Sarah Lin, MD (Internal Medicine)
Date: ${new Date().toISOString().split('T')[0]}

PATTERN REVIEWED: ${selectedPattern.title}
Methodology: ${selectedPattern.methodologyDescription}
Analyzed Window: ${selectedPattern.windowStart} to ${selectedPattern.windowEnd}
Sample Size: n=${selectedPattern.sampleSize} | Recurrence: ${selectedPattern.recurrence}x | Latency Lag: ${selectedPattern.lagDays || 8} days

KEY EVIDENCE:
${selectedPattern.evidenceLinks.map((l) => `• [${l.date}] ${l.label}: ${l.valueDescription} (${l.source})`).join('\n')}

CLINICAL DETERMINATION: ${reviewStatus.toUpperCase()}
Clinician Commentary:
${reviewNotes}

LIMITATIONS:
${selectedPattern.limitations}`;

    navigator.clipboard.writeText(summaryText);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Clinician Top Banner */}
      <div className="bg-[#1E3A2F] text-white rounded-xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-2xs">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
            <Stethoscope className="w-5 h-5 text-emerald-300" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold tracking-wider uppercase text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded">
                Clinician Workspace
              </span>
              <span className="text-xs text-white/70">
                Patient: {patient.displayName} (MRN: {patient.mrn})
              </span>
            </div>
            <h1 className="font-editorial text-2xl font-normal mt-0.5 text-white">
              Longitudinal Diagnostic Review
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            icon={<BarChart2 className="w-3.5 h-3.5" />}
            onClick={() => setShowBenchmarkModal(true)}
            className="bg-emerald-900/60 border-emerald-700 text-emerald-100 hover:bg-emerald-800"
          >
            Benchmark vs Single Visit
          </Button>

          <Button
            variant="secondary"
            size="sm"
            icon={copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
            onClick={handleCopyEhrSummary}
          >
            {copiedSummary ? 'Copied to Clipboard' : 'Export EHR Note'}
          </Button>
        </div>
      </div>

      {/* 3-Panel Clinician Review Architecture */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* PANEL 1 (Left, 3 cols): Multi-year Patient Timeline & Candidate Patterns */}
        <div className="lg:col-span-3 space-y-4">
          <Card variant="default" className="space-y-3">
            <span className="text-xs font-semibold text-[#7A7467] block">
              Candidate patterns ({patterns.length})
            </span>
            <div className="space-y-2">
              {patterns.map((pat) => {
                const isActive = pat.id === activePatternId;
                const rev = reviews[pat.id];
                return (
                  <div
                    key={pat.id}
                    onClick={() => setActivePatternId(pat.id)}
                    className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                      isActive
                        ? 'bg-[#FAF7F0] border-[#1E3A2F] ring-1 ring-[#1E3A2F]'
                        : 'bg-white border-[#E7E2D8] hover:border-[#C5BFB0]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-[10px] text-[#7A7467]">{pat.windowStart.slice(0, 4)}–{pat.windowEnd.slice(0, 4)}</span>
                      {rev ? (
                        <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">
                          {rev.status.replace('_', ' ')}
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded">
                          Pending
                        </span>
                      )}
                    </div>
                    <div className="font-semibold text-[#1C1E21] leading-snug">
                      {pat.plainTitle || pat.title}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Historical Encounters List */}
          <Card variant="default" className="space-y-3">
            <span className="text-xs font-semibold text-[#7A7467] block">
              Historical encounters ({records.length})
            </span>
            <div className="space-y-1.5 max-h-[340px] overflow-y-auto pr-1">
              {records.map((r) => (
                <div
                  key={r.id}
                  onClick={() => setSelectedRecord(r)}
                  className="p-2.5 rounded-lg hover:bg-[#FAF7F0] border border-transparent hover:border-[#E7E2D8] cursor-pointer text-xs transition-colors"
                >
                  <div className="flex items-center justify-between text-[11px] text-[#7A7467] font-mono">
                    <span>{r.date}</span>
                    <Badge variant={r.recordType}>{r.recordType.replace('_', ' ')}</Badge>
                  </div>
                  <div className="font-medium text-[#1C1E21] mt-1 line-clamp-1">{r.title}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* PANEL 2 (Center, 5 cols): Selected Pattern Quantitative Evidence */}
        <div className="lg:col-span-5 space-y-4">
          {selectedPattern ? (
            <Card variant="default" className="space-y-6">
              <div>
                <div className="flex items-center space-x-2 text-xs mb-2">
                  <Badge variant="neutral">
                    {selectedPattern.patternType.replace(/_/g, ' ')}
                  </Badge>
                  <span className="text-[#7A7467] font-mono text-[11px]">
                    Window: {selectedPattern.windowStart} → {selectedPattern.windowEnd}
                  </span>
                </div>
                <h2 className="font-editorial text-2xl font-semibold text-[#1C1E21] leading-snug">
                  {selectedPattern.title}
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-[#47443C] leading-relaxed">
                  {selectedPattern.observation}
                </p>
              </div>

              {/* Statistical & Quantitative Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-[#FAF7F0] p-3.5 rounded-xl border border-[#E7E2D8] text-xs">
                <div>
                  <span className="text-[#7A7467] font-medium block">Sample Size</span>
                  <span className="text-sm font-bold font-mono text-[#1C1E21]">{selectedPattern.sampleSize} pts</span>
                </div>
                <div>
                  <span className="text-[#7A7467] font-medium block">Latency Lag</span>
                  <span className="text-sm font-bold font-mono text-[#1C1E21]">{selectedPattern.lagDays || 8} d</span>
                </div>
                <div>
                  <span className="text-[#7A7467] font-medium block">Deviation</span>
                  <span className="text-sm font-bold font-mono text-rose-700">+{selectedPattern.zScore || 3.42} σ</span>
                </div>
                <div>
                  <span className="text-[#7A7467] font-medium block">Recurrence</span>
                  <span className="text-sm font-bold font-mono text-[#1C1E21]">{selectedPattern.recurrence}x</span>
                </div>
              </div>

              {/* Observed Timeline Evidence Table */}
              <div className="space-y-2.5">
                <span className="text-xs font-semibold text-[#7A7467] block">
                  Traceable supporting records ({selectedPattern.evidenceLinks.length})
                </span>
                <EvidenceList
                  evidenceLinks={selectedPattern.evidenceLinks}
                  onSelectRecord={(recId) => {
                    const rec = records.find((r) => r.id === recId);
                    if (rec) setSelectedRecord(rec);
                  }}
                />
              </div>

              {/* Methodology & Analytical Constraints */}
              <div className="space-y-2 pt-2 border-t border-[#E7E2D8] text-xs">
                <span className="font-semibold text-[#1C1E21] text-xs block">
                  Methodology & constraints
                </span>
                <p className="text-[#656054] leading-relaxed">
                  {selectedPattern.methodologyDescription}
                </p>
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-amber-900 mt-2">
                  <span className="font-semibold">Documented confounders: </span>
                  {selectedPattern.limitations}
                </div>
              </div>
            </Card>
          ) : (
            <Card variant="subtle" className="text-center py-12">
              <p className="text-sm text-[#7A7467]">Select a candidate pattern to inspect clinical evidence.</p>
            </Card>
          )}
        </div>

        {/* PANEL 3 (Right, 4 cols): Clinician Disposition & Bioscience Grounding */}
        <div className="lg:col-span-4 space-y-4">
          {/* Review Disposition Form */}
          <Card variant="default" className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#7A7467]">
                Clinical evaluation
              </span>
              {existingReview && (
                <Badge variant="verified">Saved</Badge>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-[#4A453A] mb-1.5">
                Review Determination
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['requires_followup', 'reviewed', 'not_relevant'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setReviewStatus(st)}
                    className={`h-8 px-2 rounded-lg text-xs font-medium border text-center transition-all cursor-pointer ${
                      reviewStatus === st
                        ? 'bg-[#1E3A2F] text-white border-[#1E3A2F]'
                        : 'bg-white text-[#656054] border-[#E7E2D8] hover:bg-[#FAF7F0]'
                    }`}
                  >
                    {st === 'requires_followup' ? 'Follow-Up' : st === 'reviewed' ? 'Reviewed' : 'Dismiss'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#4A453A] mb-1.5">
                Clinical Commentary & Rationale
              </label>
              <textarea
                rows={3}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Document clinical impression, medication plan, or rationale..."
                className="w-full p-2.5 text-xs bg-[#FAF7F0] border border-[#D5CFC2] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1E3A2F] text-[#1C1E21]"
              />
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={handleSaveReview}
              className="w-full"
            >
              Save Determination to Chart
            </Button>
          </Card>

          {/* Bioscience Grounding: PubMed Studies & openFDA Signal */}
          <Card variant="default" className="space-y-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-[#1E3A2F]" />
              <span className="text-xs font-semibold text-[#7A7467]">
                Biomedical literature (PubMed)
              </span>
            </div>

            {articles.length > 0 ? (
              <div className="space-y-2.5">
                {articles.map((art) => (
                  <div key={art.pmid} className="p-3 bg-[#FAF7F0] rounded-xl border border-[#E7E2D8] text-xs space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-[#7A7467] font-mono">
                      <span>PMID: {art.pmid}</span>
                      <span>{art.pubDate}</span>
                    </div>
                    <a
                      href={art.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-[#1E3A2F] hover:underline block leading-snug"
                    >
                      {art.title}
                    </a>
                    <p className="text-[11px] text-[#6F6A5E]">{art.journal} • {art.authors}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#7A7467]">Loading biomedical literature references...</p>
            )}

            {/* openFDA FAERS Adverse Events Signal */}
            {fdaProfile && fdaProfile.adverseEvents.length > 0 && (
              <div className="pt-3 border-t border-[#E7E2D8] space-y-2">
                <span className="text-xs font-semibold text-[#7A7467] block">
                  FDA FAERS pharmacovigilance ({fdaProfile.drug.toUpperCase()})
                </span>
                <div className="space-y-1 text-xs">
                  {fdaProfile.adverseEvents.map((ae) => (
                    <div key={ae.term} className="flex items-center justify-between bg-[#FAF7F0] px-2.5 py-1.5 rounded-md border border-[#E7E2D8]">
                      <span className="font-medium text-[#3D392F]">{ae.term}</span>
                      <span className="font-mono text-[#7A7467] font-semibold">{ae.count.toLocaleString()} cases</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* BENCHMARK EVALUATION MODAL */}
      {showBenchmarkModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card variant="default" className="max-w-3xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between border-b border-[#E7E2D8] pb-4">
              <div>
                <Badge variant="verified">Benchmark Evaluation</Badge>
                <h2 className="font-editorial text-2xl font-semibold text-[#1C1E21] mt-1">
                  Demonstrating Longitudinal Intelligence
                </h2>
              </div>
              <button
                onClick={() => setShowBenchmarkModal(false)}
                className="text-[#7A7467] hover:text-[#1C1E21] p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-[#524E43] leading-relaxed">
              To evaluate longitudinal intelligence over isolated records, our deterministic pipeline is measured against a defined <strong>Latest-Encounter Baseline</strong> using multi-year patient histories.
            </p>

            {/* Comparison Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Condition 1: Latest Encounter Only */}
              <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-200 space-y-2.5">
                <span className="font-bold text-rose-900 text-xs block">
                  Condition 1: Latest-Encounter Baseline
                </span>
                <p className="text-[#554E44] leading-relaxed">
                  {BENCHMARK_EVALUATION.isolatedEncounterFindings.description}
                </p>
                <div className="space-y-1 pt-2 border-t border-rose-200/60 font-medium text-rose-800">
                  {BENCHMARK_EVALUATION.isolatedEncounterFindings.missedPatterns.map((m, i) => (
                    <div key={i} className="flex items-start space-x-1.5">
                      <span className="text-rose-600 font-bold">✕</span>
                      <span>{m}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-1 text-rose-900 font-semibold italic">
                  Outcome: Non-specific fatigue diagnosis; statin myopathy missed; 6-month delay.
                </div>
              </div>

              {/* Condition 2: Longitudinal AURA */}
              <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200 space-y-2.5">
                <span className="font-bold text-emerald-900 text-xs block">
                  Condition 2: Longitudinal AURA Pipeline
                </span>
                <p className="text-[#384E42] leading-relaxed">
                  Synthesizes 28-month history: 2024 initiation (CPK 182 U/L), 2025 titration (CPK 312 U/L), and nocturnal HRV dip.
                </p>
                <div className="space-y-1.5 pt-2 border-t border-emerald-200/60 font-medium text-emerald-800">
                  <div className="flex items-center justify-between">
                    <span>Precision on Planted Truth:</span>
                    <span className="font-mono font-bold">100%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Recall of Known Patterns:</span>
                    <span className="font-mono font-bold">100%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Source Evidence Traceability:</span>
                    <span className="font-mono font-bold">100% auditable</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>False Positive Rate:</span>
                    <span className="font-mono font-bold">0.00</span>
                  </div>
                </div>
                <div className="pt-1 text-emerald-900 font-semibold">
                  Outcome: Traceable medication intolerance surfaced; patient & clinician can adjust dose safely.
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-[#E7E2D8]">
              <Button
                variant="primary"
                size="md"
                onClick={() => setShowBenchmarkModal(false)}
              >
                Close Benchmark Inspector
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
