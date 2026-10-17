import React, { useState } from 'react';
import { useHealth } from '../context/HealthContext';
import { PatternCandidate, HealthRecord } from '../types';
import { PageHeader } from './common/PageHeader';
import { SectionHeader } from './common/SectionHeader';
import { Card } from './common/Card';
import { Badge } from './common/Badge';
import { Button } from './common/Button';
import { EvidenceList } from './common/EvidenceList';
import { EmptyState } from './common/EmptyState';
import {
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Plus,
  Pill,
  FileCheck,
} from 'lucide-react';

export const HealthStoryView: React.FC = () => {
  const {
    patterns,
    records,
    setSelectedPattern,
    setSelectedRecord,
    setIsAddRecordModalOpen,
  } = useHealth();

  const [isEvidenceExpanded, setIsEvidenceExpanded] = useState(false);
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  // Primary finding via ranking logic
  const primaryFinding: PatternCandidate | null = patterns[0] || null;
  const secondaryFindings = patterns.slice(1, 3);

  // Chronologically sorted records (newest first for timeline)
  const sortedRecords = [...records].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Initially show only 3 most relevant events
  const displayedRecords = showAllEvents ? sortedRecords : sortedRecords.slice(0, 3);

  // Restrained, neutral recurrence label
  const getRestrainedRecurrence = (pat: PatternCandidate) => {
    if (pat.recurrence > 1) {
      return `Observed ${pat.recurrence} times`;
    }
    return 'Observed over time';
  };

  const getMarkerDotColor = (type: HealthRecord['recordType']) => {
    switch (type) {
      case 'prescription':
        return 'bg-indigo-600';
      case 'medication':
        return 'bg-amber-600';
      case 'lab_report':
        return 'bg-emerald-600';
      case 'symptom':
        return 'bg-rose-600';
      default:
        return 'bg-stone-500';
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
      {/* 1. Page Header */}
      <PageHeader
        title="Your Health Story"
        subtitle="Your health, connected over time."
      />

      {/* 2. Compact, Editorial Primary Finding */}
      {primaryFinding ? (
        <Card variant="default" className="space-y-4">
          {/* Subtle indicator bar */}
          <div className="flex items-center justify-between text-xs text-[#7A7467]">
            <span className="font-medium text-[#4A463D]">
              {getRestrainedRecurrence(primaryFinding)}
            </span>
            <span className="font-mono text-[11px] text-[#8C8678]">
              {primaryFinding.windowStart.slice(0, 4)} – {primaryFinding.windowEnd.slice(0, 4)}
            </span>
          </div>

          {/* Plain-English Headline */}
          <div>
            <h2 className="font-editorial text-2xl font-semibold text-[#1C1E21] leading-snug">
              {primaryFinding.plainTitle || 'Muscle symptoms followed medication changes'}
            </h2>
            <p className="mt-1.5 text-sm text-[#4A463D] leading-relaxed">
              {primaryFinding.shortSummary ||
                'Leg discomfort and muscle stress markers consistently followed statin dose increases within about a week.'}
            </p>
          </div>

          {/* Actions & Expandable Evidence */}
          <div className="pt-3 flex flex-wrap items-center justify-between gap-3 text-xs border-t border-[#E7E2D8]">
            <button
              onClick={() => setIsEvidenceExpanded(!isEvidenceExpanded)}
              className="inline-flex items-center space-x-1.5 text-[#1E3A2F] font-semibold hover:text-[#162C23] transition-colors py-1 cursor-pointer"
            >
              <span>{isEvidenceExpanded ? 'Hide evidence' : 'See evidence'}</span>
              {isEvidenceExpanded ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            <button
              onClick={() => setSelectedPattern(primaryFinding)}
              className="inline-flex items-center space-x-1 text-[#656054] hover:text-[#1C1E21] font-medium transition-colors cursor-pointer"
            >
              <span>Full finding details</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Expandable Evidence Drawer */}
          {isEvidenceExpanded && (
            <div className="pt-3 border-t border-[#E7E2D8] space-y-3">
              <span className="text-xs font-semibold text-[#7A7467] block">
                Supporting measurements & timing
              </span>

              <EvidenceList
                evidenceLinks={primaryFinding.evidenceLinks}
                onSelectRecord={(recId) => {
                  const rec = records.find((r) => r.id === recId);
                  if (rec) setSelectedRecord(rec);
                }}
              />

              {primaryFinding.limitations && (
                <div className="p-3 bg-[#FAF7F0] rounded-xl text-xs text-[#656054] border border-[#E7E2D8] leading-relaxed">
                  <span className="font-semibold text-[#1C1E21]">Note: </span>
                  {primaryFinding.limitations}
                </div>
              )}
            </div>
          )}
        </Card>
      ) : (
        <EmptyState
          title="No active patterns detected"
          description="Patterns will automatically be identified as new longitudinal records and lab tests are connected."
          actionLabel="Add Medical Record"
          onAction={() => setIsAddRecordModalOpen(true)}
        />
      )}

      {/* 3. Visual Chronological Timeline */}
      <section aria-label="Visual Chronological Timeline" className="space-y-4 pt-2">
        <SectionHeader
          title="Recent Timeline"
          subtitle="Chronological sequence of clinical events, prescriptions, symptoms, and lab results."
          action={
            <Button
              variant="ghost"
              size="sm"
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => setIsAddRecordModalOpen(true)}
            >
              Add Record
            </Button>
          }
        />

        {/* Visual Timeline Rail */}
        <div className="relative pl-6 sm:pl-7 border-l border-[#E7E2D8] space-y-4">
          {displayedRecords.map((record) => {
            const isExpanded = expandedEventId === record.id;
            const dotColor = getMarkerDotColor(record.recordType);
            const isPrescription = record.recordType === 'prescription';
            const rx = record.prescriptionDetails;

            return (
              <div key={record.id} className="relative group">
                {/* Visual Marker on the Rail */}
                <div
                  className={`absolute -left-[31px] sm:-left-[35px] top-3.5 w-3.5 h-3.5 rounded-full border-2 border-[#FBF9F5] ${dotColor} shadow-2xs group-hover:scale-125 transition-transform`}
                />

                {/* Event Summary Card */}
                <Card
                  variant="interactive"
                  onClick={() => setExpandedEventId(isExpanded ? null : record.id)}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center space-x-2">
                      <Badge recordType={record.recordType}>
                        {record.recordType.replace('_', ' ')}
                      </Badge>
                      <span className="font-mono text-[#8C8678] text-[11px]">{record.date}</span>

                      {isPrescription && (
                        <span className="text-[10px] text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 font-medium hidden sm:inline">
                          {rx?.isTakenConfirmed ? 'Intake Confirmed' : 'Prescription Document'}
                        </span>
                      )}
                    </div>

                    <span className="text-[11px] text-[#8C8678] font-mono hidden sm:inline">
                      {record.source}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between">
                    <h3 className="font-editorial text-base font-semibold text-[#1C1E21]">
                      {record.title}
                    </h3>
                    <span className="text-xs text-[#7A7467] font-medium ml-2">
                      {isExpanded ? 'Less' : 'Details'}
                    </span>
                  </div>

                  {/* Prescription inline callout */}
                  {isPrescription && rx && (
                    <div className="flex items-center space-x-2 text-xs text-[#1E3A2F] font-medium bg-[#FAF7F0] px-2.5 py-1 rounded-md border border-[#E7E2D8]">
                      <Pill className="w-3.5 h-3.5 text-indigo-700 shrink-0" />
                      <span>{rx.medicationName} {rx.strength || ''}</span>
                      {rx.frequency && <span className="text-[#656054]">— {rx.frequency}</span>}
                    </div>
                  )}

                  {/* Concise summary */}
                  <p className="text-xs text-[#656054] line-clamp-2 leading-relaxed">
                    {record.summary}
                  </p>

                  {/* Expandable Details Panel for this Event */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-[#E7E2D8] space-y-3 text-xs">
                      {/* Prescription details display */}
                      {isPrescription && rx && (
                        <div className="p-3 bg-[#FAF7F0] rounded-xl border border-[#E7E2D8] space-y-2">
                          <div className="flex items-center space-x-1.5 text-[#1C1E21] font-semibold">
                            <FileCheck className="w-4 h-4 text-indigo-700" />
                            <span>Prescription Specifications</span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                            <div>
                              <span className="text-[#7A7467] block">Medication:</span>
                              <span className="font-medium text-[#1C1E21]">{rx.medicationName}</span>
                            </div>
                            <div>
                              <span className="text-[#7A7467] block">Strength:</span>
                              <span className="font-medium text-[#1C1E21]">{rx.strength || 'Unknown'}</span>
                            </div>
                            <div>
                              <span className="text-[#7A7467] block">Frequency:</span>
                              <span className="font-medium text-[#1C1E21]">{rx.frequency || 'Unknown'}</span>
                            </div>
                            <div>
                              <span className="text-[#7A7467] block">Prescriber:</span>
                              <span className="font-medium text-[#1C1E21]">{rx.prescribingClinician || 'Unknown'}</span>
                            </div>
                          </div>
                          <div className="text-[11px] text-[#7A7467] pt-1 border-t border-[#E7E2D8]">
                            Note: Prescription authorization is distinct from confirmed medication history. Adherence is not assumed.
                          </div>
                        </div>
                      )}

                      {record.extractedFacts && record.extractedFacts.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {record.extractedFacts.map((fact) => (
                            <span
                              key={fact.id}
                              className="px-2 py-1 rounded-md bg-[#FAF7F0] border border-[#E7E2D8] text-[#3D392F]"
                            >
                              <span className="font-medium">{fact.metricLabel}:</span>{' '}
                              <span className="font-mono font-semibold">
                                {fact.numericValue !== null ? fact.numericValue : 'Recorded'} {fact.unit}
                              </span>
                              {fact.status === 'elevated' && (
                                <span className="ml-1 text-rose-700 font-bold">▲</span>
                              )}
                              {fact.status === 'low' && (
                                <span className="ml-1 text-amber-700 font-bold">▼</span>
                              )}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[11px] text-[#7A7467] pt-1">
                        <span>Source: {record.source}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRecord(record);
                          }}
                          className="font-medium text-[#1E3A2F] hover:underline cursor-pointer"
                        >
                          View source document & attachment →
                        </button>
                      </div>
                    </div>
                  )}
                </Card>
              </div>
            );
          })}
        </div>

        {/* View All Events / View Fewer Events Button */}
        {sortedRecords.length > 3 && (
          <div className="pt-2">
            <button
              onClick={() => setShowAllEvents(!showAllEvents)}
              className="text-xs font-semibold text-[#1E3A2F] hover:text-[#162C23] transition-colors py-1 cursor-pointer"
            >
              {showAllEvents
                ? 'Show fewer events'
                : `View all ${sortedRecords.length} events →`}
            </button>
          </div>
        )}
      </section>

      {/* 4. Secondary Observations */}
      {secondaryFindings.length > 0 && (
        <section aria-label="Other Observed Patterns" className="pt-4 border-t border-[#E7E2D8] space-y-3">
          <SectionHeader
            title="Other Observed Patterns"
            subtitle="Secondary longitudinal relationships detected across your history."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {secondaryFindings.map((finding) => (
              <Card
                key={finding.id}
                variant="interactive"
                onClick={() => setSelectedPattern(finding)}
                className="space-y-1.5"
              >
                <div className="flex items-center justify-between text-[#8C8678] font-mono text-[11px]">
                  <span>{getRestrainedRecurrence(finding)}</span>
                  <span>{finding.windowStart.slice(0, 4)}–{finding.windowEnd.slice(0, 4)}</span>
                </div>
                <h3 className="font-editorial text-sm font-semibold text-[#1C1E21] leading-snug">
                  {finding.plainTitle || finding.title}
                </h3>
                <p className="text-xs text-[#656054] line-clamp-2 leading-relaxed">
                  {finding.shortSummary || finding.observation}
                </p>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
