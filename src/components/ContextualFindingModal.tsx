import React, { useState, useEffect } from 'react';
import { useHealth } from '../context/HealthContext';
import {
  fetchPubMedLiterature,
  fetchFdaAdverseEvents,
  fetchPubChemCompound,
  PubMedArticle,
  FdaDrugProfile,
  PubChemCompound,
} from '../services/scienceService';
import {
  X,
  AlertTriangle,
  BookOpen,
} from 'lucide-react';
import { Button } from './common/Button';
import { EvidenceList } from './common/EvidenceList';

export const ContextualFindingModal: React.FC = () => {
  const { selectedPattern, setSelectedPattern, setSelectedRecord, records, patient } = useHealth();
  const [activeTab, setActiveTab] = useState<'evidence' | 'limitations' | 'next_steps' | 'science'>('evidence');

  // Gemini AI-assisted evidence explanation state
  const [aiExplanation, setAiExplanation] = useState<any>(null);
  const [, setAiLoading] = useState(false);

  // Bioscience skill states
  const [articles, setArticles] = useState<PubMedArticle[]>([]);
  const [fdaData, setFdaData] = useState<FdaDrugProfile | null>(null);
  const [compoundData, setCompoundData] = useState<PubChemCompound | null>(null);

  useEffect(() => {
    if (!selectedPattern) {
      setAiExplanation(null);
      return;
    }

    // Call server-side Gemini explanation layer
    setAiLoading(true);
    fetch('/api/explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pattern: selectedPattern,
        evidencePoints: selectedPattern.evidenceLinks,
        patientContext: {
          age: patient.age,
          gender: patient.gender,
          conditions: patient.primaryConditions,
        },
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.explanation) {
          setAiExplanation(data.explanation);
        }
      })
      .catch((err) => console.error('Gemini explanation error:', err))
      .finally(() => setAiLoading(false));

    // Load Bioscience data
    const searchTerm = selectedPattern.title.toLowerCase().includes('cpk')
      ? 'statin myopathy CPK elevation'
      : selectedPattern.title.toLowerCase().includes('ferritin')
      ? 'ferritin depletion fatigue'
      : 'heart rate variability recovery';

    fetchPubMedLiterature(searchTerm).then(setArticles);

    if (selectedPattern.title.toLowerCase().includes('statin') || selectedPattern.title.toLowerCase().includes('atorvastatin')) {
      fetchFdaAdverseEvents('atorvastatin').then(setFdaData);
      fetchPubChemCompound('atorvastatin').then((comp) => {
        setCompoundData(comp);
      });
    } else {
      setFdaData(null);
      setCompoundData(null);
    }
  }, [selectedPattern, patient]);

  if (!selectedPattern) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col border border-[#E7E2D8] shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-5 bg-[#FAF7F0] border-b border-[#E7E2D8] flex items-start justify-between">
          <div className="space-y-1 pr-6">
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-[#4A463D] font-medium">
                {selectedPattern.recurrence > 1 ? `Observed ${selectedPattern.recurrence} times` : 'Observed pattern'}
              </span>
              <span className="text-[#8C8678]">•</span>
              <span className="text-[#7A7467] font-mono">
                {selectedPattern.windowStart.slice(0, 4)} → {selectedPattern.windowEnd.slice(0, 4)}
              </span>
            </div>
            <h2 className="font-editorial text-2xl font-semibold text-[#1C1E21] leading-snug">
              {selectedPattern.plainTitle || selectedPattern.title}
            </h2>
            {selectedPattern.plainTitle && (
              <p className="text-xs text-[#7A7467] font-mono">
                Clinical registry: {selectedPattern.title}
              </p>
            )}
          </div>

          <button
            onClick={() => setSelectedPattern(null)}
            className="text-[#7A7467] hover:text-[#1C1E21] p-1.5 rounded-lg hover:bg-[#F2ECE0] transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#E7E2D8] px-6 bg-white overflow-x-auto text-xs font-medium">
          <button
            onClick={() => setActiveTab('evidence')}
            className={`py-3 px-3 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'evidence'
                ? 'border-[#1E3A2F] text-[#1E3A2F] font-bold'
                : 'border-transparent text-[#656054] hover:text-[#1C1E21]'
            }`}
          >
            1. Evidence & Timeline ({selectedPattern.evidenceLinks.length})
          </button>

          <button
            onClick={() => setActiveTab('limitations')}
            className={`py-3 px-3 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'limitations'
                ? 'border-[#1E3A2F] text-[#1E3A2F] font-bold'
                : 'border-transparent text-[#656054] hover:text-[#1C1E21]'
            }`}
          >
            2. Strength & Limitations
          </button>

          <button
            onClick={() => setActiveTab('next_steps')}
            className={`py-3 px-3 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'next_steps'
                ? 'border-[#1E3A2F] text-[#1E3A2F] font-bold'
                : 'border-transparent text-[#656054] hover:text-[#1C1E21]'
            }`}
          >
            3. Questions for Clinician
          </button>

          <button
            onClick={() => setActiveTab('science')}
            className={`py-3 px-3 border-b-2 transition-all whitespace-nowrap flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'science'
                ? 'border-[#1E3A2F] text-[#1E3A2F] font-bold'
                : 'border-transparent text-[#656054] hover:text-[#1C1E21]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-[#1E3A2F]" />
            <span>4. Bioscience Grounding</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm flex-1">
          {/* Plain language overview card always visible at top */}
          <div className="bg-[#FAF7F0] p-4 rounded-xl border border-[#E7E2D8]">
            <span className="text-xs font-semibold text-[#7A7467] block mb-1">
              What was observed?
            </span>
            <p className="text-base text-[#1C1E21] leading-relaxed">
              {aiExplanation?.plainExplanation || selectedPattern.observation}
            </p>
          </div>

          {/* TAB 1: Evidence & Timeline */}
          {activeTab === 'evidence' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#7A7467]">
                  Traceable supporting records
                </span>
                <span className="text-xs text-[#7A7467]">
                  Click any entry to inspect original document
                </span>
              </div>

              <EvidenceList
                evidenceLinks={selectedPattern.evidenceLinks}
                onSelectRecord={(recId) => {
                  const rec = records.find((r) => r.id === recId);
                  if (rec) {
                    setSelectedPattern(null);
                    setSelectedRecord(rec);
                  }
                }}
              />
            </div>
          )}

          {/* TAB 2: Strength & Limitations */}
          {activeTab === 'limitations' && (
            <div className="space-y-6">
              {/* Evidence Strength Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-4 bg-[#FAF7F0] rounded-xl border border-[#E7E2D8]">
                  <span className="font-semibold text-[#7A7467] block mb-1">Evidence Support</span>
                  <span className="text-base font-bold text-emerald-800 capitalize">{selectedPattern.evidenceStrength}</span>
                  <p className="text-[#656054] mt-1">Multi-period recurrence with lab measurements.</p>
                </div>

                <div className="p-4 bg-[#FAF7F0] rounded-xl border border-[#E7E2D8]">
                  <span className="font-semibold text-[#7A7467] block mb-1">Recurrence</span>
                  <span className="text-base font-bold text-[#1C1E21] font-mono">{selectedPattern.recurrence}x Independent Instances</span>
                  <p className="text-[#656054] mt-1">Observed in both 2024 and 2025.</p>
                </div>

                <div className="p-4 bg-[#FAF7F0] rounded-xl border border-[#E7E2D8]">
                  <span className="font-semibold text-[#7A7467] block mb-1">Data Quality</span>
                  <span className="text-base font-bold text-[#1C1E21] capitalize">{selectedPattern.dataQuality}</span>
                  <p className="text-[#656054] mt-1">Complete lab assays and wearable coverage.</p>
                </div>
              </div>

              {/* What does it NOT establish? */}
              <div className="p-5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
                <div className="flex items-center space-x-2 text-amber-900 font-semibold text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-700" />
                  <span>What this finding does not establish</span>
                </div>
                <p className="text-xs text-amber-950 leading-relaxed">
                  {aiExplanation?.unestablishedCaveats || selectedPattern.unestablishedCaveats || selectedPattern.limitations}
                </p>
                <p className="text-xs text-amber-900/80 pt-1">
                  Temporal co-occurrence is not proof of causality. Other unrecorded factors (such as unrecorded exertion, viral illness, or diet changes) could contribute.
                </p>
              </div>

              {/* Methodology audit note */}
              <div className="p-4 bg-white border border-[#E7E2D8] rounded-xl text-xs space-y-1">
                <span className="font-semibold text-[#1C1E21]">Analysis Pipeline: </span>
                <span className="text-[#656054]">{selectedPattern.methodologyDescription}</span>
              </div>
            </div>
          )}

          {/* TAB 3: Next Steps & Doctor Questions */}
          {activeTab === 'next_steps' && (
            <div className="space-y-5">
              <div>
                <span className="text-xs font-semibold text-[#7A7467] block mb-1">
                  Questions to prepare for your doctor
                </span>
                <p className="text-xs text-[#656054]">
                  You can bring these questions to Dr. Sarah Lin or your physician to discuss the timeline.
                </p>
              </div>

              <div className="space-y-3">
                {(aiExplanation?.questionsForDoctor || selectedPattern.questionsForClinician).map((q: string, idx: number) => (
                  <div
                    key={idx}
                    className="p-4 bg-[#FAF7F0] rounded-xl border border-[#E7E2D8] text-sm text-[#1C1E21] flex items-start space-x-3"
                  >
                    <span className="w-6 h-6 rounded-full bg-[#1E3A2F] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed font-medium">{q}</span>
                  </div>
                ))}
              </div>

              {aiExplanation?.clinicianTalkingPoints && (
                <div className="pt-4 border-t border-[#E7E2D8]">
                  <span className="text-xs font-semibold text-[#7A7467] block mb-2">
                    Key clinical talking points
                  </span>
                  <ul className="list-disc pl-5 space-y-1 text-xs text-[#656054]">
                    {aiExplanation.clinicianTalkingPoints.map((pt: string, i: number) => (
                      <li key={i}>{pt}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Bioscience Grounding */}
          {activeTab === 'science' && (
            <div className="space-y-6">
              {/* PubMed Section */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <BookOpen className="w-4 h-4 text-[#1E3A2F]" />
                  <span className="text-xs font-semibold text-[#7A7467]">
                    Published biomedical literature (PubMed / NCBI)
                  </span>
                </div>

                <div className="space-y-3">
                  {articles.map((art) => (
                    <div key={art.pmid} className="p-4 bg-[#FAF7F0] rounded-xl border border-[#E7E2D8] text-xs space-y-1.5">
                      <div className="flex items-center justify-between text-[#7A7467] font-mono text-[11px]">
                        <span>PMID: {art.pmid}</span>
                        <span>{art.pubDate}</span>
                      </div>
                      <a
                        href={art.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-semibold text-[#1E3A2F] hover:underline block leading-snug"
                      >
                        {art.title}
                      </a>
                      <p className="text-xs text-[#656054]">{art.journal} • {art.authors}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* openFDA Section */}
              {fdaData && (
                <div className="p-5 bg-white rounded-xl border border-[#E7E2D8] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#7A7467]">
                      FDA pharmacovigilance (openFDA FAERS)
                    </span>
                    <span className="text-xs font-mono text-[#7A7467]">{fdaData.drug.toUpperCase()}</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {fdaData.adverseEvents.map((ae) => (
                      <div key={ae.term} className="p-2.5 bg-[#FAF7F0] rounded-lg border border-[#E7E2D8]">
                        <div className="font-semibold text-[#1C1E21]">{ae.term}</div>
                        <div className="text-[#7A7467] font-mono text-[11px]">{ae.count.toLocaleString()} cases</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PubChem Chemical Structure */}
              {compoundData && (
                <div className="p-5 bg-white rounded-xl border border-[#E7E2D8] flex flex-col sm:flex-row items-center gap-6">
                  <img
                    src={compoundData.depiction2DUrl}
                    alt={compoundData.compound}
                    className="w-32 h-32 rounded-lg border border-[#E7E2D8] bg-white p-1 object-contain"
                  />
                  <div className="space-y-1 text-xs flex-1">
                    <div className="text-[11px] font-semibold text-[#7A7467]">
                      PubChem chemical identity (CID: {compoundData.cid})
                    </div>
                    <div className="text-base font-bold text-[#1C1E21] capitalize">
                      {compoundData.compound}
                    </div>
                    <div className="font-mono text-[#656054] text-[11px]">
                      Formula: {compoundData.molecularFormula} | MW: {compoundData.molecularWeight} g/mol
                    </div>
                    <div className="font-mono text-[10px] text-[#8C8678] break-all">
                      SMILES: {compoundData.smiles}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-[#FAF7F0] border-t border-[#E7E2D8] flex items-center justify-between text-xs text-[#7A7467]">
          <span>Traceable to {selectedPattern.evidenceLinks.length} verified input records</span>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setSelectedPattern(null)}
          >
            Close Detail
          </Button>
        </div>
      </div>
    </div>
  );
};
