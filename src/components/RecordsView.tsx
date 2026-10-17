import React, { useState, useMemo } from 'react';
import { useHealth } from '../context/HealthContext';
import { RecordType } from '../types';
import { PageHeader } from './common/PageHeader';
import { Card } from './common/Card';
import { Badge } from './common/Badge';
import { Button } from './common/Button';
import { EmptyState } from './common/EmptyState';
import {
  Search,
  Plus,
  ChevronRight,
  ShieldCheck,
  File,
  Pill,
} from 'lucide-react';

export const RecordsView: React.FC = () => {
  const { records, setSelectedRecord, setIsAddRecordModalOpen } = useHealth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<RecordType | 'all'>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');

  // Unique sources
  const availableSources = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => set.add(r.source));
    return Array.from(set);
  }, [records]);

  // Filter records
  const filteredRecords = useMemo(() => {
    return records
      .filter((r) => {
        if (selectedType !== 'all' && r.recordType !== selectedType) return false;
        if (selectedSource !== 'all' && r.source !== selectedSource) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = r.title.toLowerCase().includes(q);
          const matchSummary = r.summary.toLowerCase().includes(q);
          const matchSource = r.source.toLowerCase().includes(q);
          const matchRx = r.prescriptionDetails
            ? (r.prescriptionDetails.medicationName.toLowerCase().includes(q) ||
               (r.prescriptionDetails.prescribingClinician || '').toLowerCase().includes(q) ||
               (r.prescriptionDetails.instructions || '').toLowerCase().includes(q))
            : false;
          const matchFacts = (r.extractedFacts || []).some(
            (f) => f.metricLabel.toLowerCase().includes(q) || f.metricKey.toLowerCase().includes(q)
          );
          return matchTitle || matchSummary || matchSource || matchRx || matchFacts;
        }
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [records, selectedType, selectedSource, searchQuery]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
      {/* Standardized Header */}
      <PageHeader
        title="Medical Records"
        subtitle="Prescriptions, clinical encounters, lab reports, and uploaded documents."
        action={
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => setIsAddRecordModalOpen(true)}
          >
            Add Record
          </Button>
        }
      />

      {/* Filter and Search Bar */}
      <Card variant="subtle" className="space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#7A7467]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by medication (e.g. Atorvastatin), biomarker, doctor, or clinic..."
              className="w-full pl-9 pr-4 h-9 text-xs sm:text-sm bg-white border border-[#D5CFC2] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1E3A2F] text-[#1C1E21]"
            />
          </div>

          {/* Source Dropdown */}
          <div className="flex items-center space-x-2 shrink-0">
            <span className="text-xs text-[#656054] font-medium hidden sm:inline">Source:</span>
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              aria-label="Filter records by source"
              className="px-3 h-9 text-xs sm:text-sm bg-white border border-[#D5CFC2] rounded-lg focus:outline-none text-[#1C1E21] cursor-pointer"
            >
              <option value="all">All Sources</option>
              {availableSources.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Record Type Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#E7E2D8]">
          <span className="text-xs text-[#7A7467] font-medium mr-1">Type:</span>
          {(['all', 'prescription', 'lab_report', 'clinical_note', 'medication', 'symptom', 'other_document'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 h-8 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                selectedType === type
                  ? 'bg-[#1E3A2F] text-white shadow-2xs'
                  : 'bg-white text-[#656054] border border-[#E7E2D8] hover:bg-[#FAF7F0]'
              }`}
            >
              {type === 'all'
                ? 'All Types'
                : type === 'prescription'
                ? 'Prescriptions'
                : type.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
            </button>
          ))}
        </div>
      </Card>

      {/* Records Count & Audit Notice */}
      <div className="flex items-center justify-between text-xs text-[#7A7467]">
        <span>Showing {filteredRecords.length} of {records.length} records</span>
        <span className="flex items-center space-x-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
          <span>Original provenance preserved</span>
        </span>
      </div>

      {/* Chronological Record List */}
      <div className="space-y-3">
        {filteredRecords.length === 0 ? (
          <EmptyState
            title="No records found"
            description="No medical records or prescriptions match your current filter selections. Try clearing your search query or filters."
            actionLabel="Clear filters"
            onAction={() => {
              setSelectedType('all');
              setSelectedSource('all');
              setSearchQuery('');
            }}
          />
        ) : (
          filteredRecords.map((record) => {
            const isPrescription = record.recordType === 'prescription';
            const rx = record.prescriptionDetails;

            return (
              <Card
                key={record.id}
                variant="interactive"
                onClick={() => setSelectedRecord(record)}
                className="space-y-2.5 group"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <Badge recordType={record.recordType}>
                        {record.recordType.replace('_', ' ')}
                      </Badge>
                      <span className="font-semibold text-[#1C1E21]">{record.source}</span>
                      <span className="text-[#8C8678] font-mono text-[11px]">{record.date}</span>

                      {/* Distinction between prescription order vs confirmed intake */}
                      {isPrescription && (
                        rx?.isTakenConfirmed ? (
                          <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            Active Intake Confirmed
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                            Prescription Issued (Intake Unconfirmed)
                          </span>
                        )
                      )}

                      {/* File attachment indicator */}
                      {record.attachedFile && (
                        <span className="text-[11px] text-[#524E43] font-mono flex items-center space-x-1 bg-[#FAF7F0] px-1.5 py-0.5 rounded border border-[#E7E2D8]">
                          <File className="w-3 h-3 text-[#1E3A2F]" />
                          <span>{record.attachedFile.name.endsWith('.pdf') ? 'PDF' : 'Scan'}</span>
                        </span>
                      )}

                      <Badge variant="verified">Verified</Badge>
                    </div>

                    <h3 className="font-editorial text-lg font-semibold text-[#1C1E21] group-hover:text-[#1E3A2F] transition-colors">
                      {record.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#656054] leading-relaxed">
                      {record.summary}
                    </p>

                    {/* Prescription Structured Highlights */}
                    {isPrescription && rx && (
                      <div className="bg-[#FAF7F0] p-2.5 rounded-lg border border-[#E7E2D8] flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#3D392F]">
                        <div className="flex items-center space-x-1">
                          <Pill className="w-3.5 h-3.5 text-indigo-700" />
                          <span className="font-semibold text-[#1C1E21]">{rx.medicationName}</span>
                          {rx.strength && <span className="font-mono text-[#1E3A2F]">({rx.strength})</span>}
                        </div>
                        {rx.dosage && <div>Dosage: <span className="font-medium">{rx.dosage}</span></div>}
                        {rx.frequency && <div>Freq: <span className="font-medium">{rx.frequency}</span></div>}
                        {rx.prescribingClinician && <div>Prescriber: <span className="font-medium">{rx.prescribingClinician}</span></div>}
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 flex items-center space-x-1 text-xs text-[#7A7467] font-medium pt-1 sm:pt-0">
                    <span>Inspect details</span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#A59F92] group-hover:text-[#1E3A2F] transition-colors" />
                  </div>
                </div>

                {/* Extracted Biomarkers or Doses Table */}
                {record.extractedFacts && record.extractedFacts.length > 0 && (
                  <div className="pt-2 border-t border-[#E7E2D8] flex flex-wrap gap-1.5">
                    {record.extractedFacts.map((fact) => (
                      <span
                        key={fact.id}
                        className="text-xs bg-[#FAF7F0] border border-[#E7E2D8] px-2 py-0.5 rounded-md flex items-center space-x-1 text-[#3D392F]"
                      >
                        <span className="font-medium">{fact.metricLabel}:</span>
                        <span className="font-mono font-semibold text-[#1C1E21]">
                          {fact.numericValue !== null ? fact.numericValue : 'Recorded'} {fact.unit}
                        </span>
                        {fact.status === 'elevated' && (
                          <span className="text-[10px] font-bold text-rose-700">▲</span>
                        )}
                        {fact.status === 'low' && (
                          <span className="text-[10px] font-bold text-amber-700">▼</span>
                        )}
                      </span>
                    ))}
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};
