import React, { useState, useMemo } from 'react';
import { useHealth } from '../context/HealthContext';
import { PageHeader } from './common/PageHeader';
import { SectionHeader } from './common/SectionHeader';
import { Card } from './common/Card';
import { Badge } from './common/Badge';
import { Button } from './common/Button';
import {
  ExternalLink,
  GitBranch,
} from 'lucide-react';

interface MetricOption {
  key: string;
  label: string;
  unit: string;
  refLow?: number;
  refHigh?: number;
  description: string;
}

const AVAILABLE_METRICS: MetricOption[] = [
  {
    key: 'cpk',
    label: 'Creatine Kinase (CPK)',
    unit: 'U/L',
    refLow: 30,
    refHigh: 145,
    description: 'Enzyme biomarker of skeletal muscle stress or breakdown.',
  },
  {
    key: 'hrv',
    label: 'Heart Rate Variability',
    unit: 'ms',
    refLow: 30,
    refHigh: 70,
    description: 'Autonomous recovery metric derived from nocturnal PPG telemetry.',
  },
  {
    key: 'rhr',
    label: 'Resting Heart Rate',
    unit: 'bpm',
    refLow: 55,
    refHigh: 80,
    description: 'Baseline resting cardiovascular frequency during sleep.',
  },
  {
    key: 'ferritin',
    label: 'Serum Ferritin',
    unit: 'ng/mL',
    refLow: 15,
    refHigh: 150,
    description: 'Long-term cellular iron storage biomarker.',
  },
];

export const TrendsView: React.FC = () => {
  const { observations, records, setSelectedRecord, setSelectedPattern, patterns } = useHealth();
  const [selectedMetricKey, setSelectedMetricKey] = useState<string>('cpk');
  const [showRelationshipMap, setShowRelationshipMap] = useState(false);

  const metricInfo = useMemo(() => {
    return AVAILABLE_METRICS.find((m) => m.key === selectedMetricKey) || AVAILABLE_METRICS[0];
  }, [selectedMetricKey]);

  // Filter observations for the metric
  const metricObservations = useMemo(() => {
    return observations
      .filter((o) => o.metric.toLowerCase() === selectedMetricKey.toLowerCase())
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [observations, selectedMetricKey]);

  // Compute individual baseline (mean and std dev)
  const personalBaseline = useMemo(() => {
    if (metricObservations.length < 2) return null;
    const vals = metricObservations.map((o) => o.value);
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const variance = vals.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (vals.length - 1);
    const stdDev = Math.sqrt(variance);
    return {
      mean: Number(mean.toFixed(1)),
      stdDev: Number(stdDev.toFixed(1)),
      min: Math.min(...vals),
      max: Math.max(...vals),
    };
  }, [metricObservations]);

  // Medication and symptom event markers in the time range
  const eventMarkers = useMemo(() => {
    return records
      .filter((r) => r.recordType === 'medication' || r.recordType === 'symptom')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [records]);

  // Associated candidate patterns
  const relatedPatterns = useMemo(() => {
    return patterns.filter(
      (p) =>
        p.title.toLowerCase().includes(metricInfo.key) ||
        p.title.toLowerCase().includes(metricInfo.label.toLowerCase()) ||
        p.observation.toLowerCase().includes(metricInfo.key)
    );
  }, [patterns, metricInfo]);

  // Calculate SVG plot dimensions
  const chartHeight = 220;
  const chartWidth = 720;
  const paddingX = 40;
  const paddingY = 30;

  // Compute scale bounds
  const yValues = metricObservations.map((o) => o.value);
  if (metricInfo.refHigh) yValues.push(metricInfo.refHigh);
  if (metricInfo.refLow) yValues.push(metricInfo.refLow);
  if (personalBaseline) {
    yValues.push(personalBaseline.mean + personalBaseline.stdDev);
    yValues.push(personalBaseline.mean - personalBaseline.stdDev);
  }

  const minY = Math.max(0, Math.min(...yValues) * 0.8);
  const maxY = Math.max(...yValues) * 1.15 || 100;

  const getY = (val: number) => {
    const range = maxY - minY || 1;
    return chartHeight - paddingY - ((val - minY) / range) * (chartHeight - 2 * paddingY);
  };

  const getX = (index: number, total: number) => {
    if (total <= 1) return chartWidth / 2;
    return paddingX + (index / (total - 1)) * (chartWidth - 2 * paddingX);
  };

  // SVG Points
  const points = metricObservations.map((obs, idx) => ({
    x: getX(idx, metricObservations.length),
    y: getY(obs.value),
    obs,
  }));

  const pathD = points.length > 0
    ? points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '')
    : '';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 space-y-8">
      {/* Standardized Header */}
      <PageHeader
        title="Biomarker Trends"
        subtitle="Longitudinal trajectories with baseline and reference interval separation."
        action={
          <div className="flex flex-wrap gap-1.5">
            {AVAILABLE_METRICS.map((m) => (
              <button
                key={m.key}
                onClick={() => setSelectedMetricKey(m.key)}
                className={`px-3 h-8 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                  selectedMetricKey === m.key
                    ? 'bg-[#1E3A2F] text-white border-[#1E3A2F] shadow-2xs'
                    : 'bg-white text-[#656054] border-[#E7E2D8] hover:bg-[#FAF7F0]'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        }
      />

      {/* Main Analytical Chart Card */}
      <Card variant="default" className="space-y-6">
        {/* Metric Overview Bar */}
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 border-b border-[#E7E2D8] pb-4">
          <div>
            <h2 className="font-editorial text-2xl font-semibold text-[#1C1E21]">
              {metricInfo.label}
            </h2>
            <p className="text-xs text-[#7A7467] mt-0.5">{metricInfo.description}</p>
          </div>

          <div className="flex items-center space-x-4 text-xs font-mono">
            {personalBaseline && (
              <div className="text-[#1E3A2F]">
                <span className="font-sans font-medium text-[#7A7467] mr-1">Personal Baseline:</span>
                <span className="font-bold">{personalBaseline.mean}</span> {metricInfo.unit} (±{personalBaseline.stdDev})
              </div>
            )}
            {metricInfo.refHigh !== undefined && (
              <div className="text-[#656054]">
                <span className="font-sans font-medium text-[#7A7467] mr-1">Lab Reference:</span>
                {metricInfo.refLow ?? 0} – {metricInfo.refHigh} {metricInfo.unit}
              </div>
            )}
          </div>
        </div>

        {/* Legend Explaining the Conceptual Distinction */}
        <div className="flex flex-wrap items-center gap-5 text-xs text-[#656054] bg-[#FAF7F0] p-3 rounded-xl border border-[#E7E2D8]">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1E3A2F]" />
            <span className="font-medium text-[#1C1E21]">Measurement Point</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-4 h-1.5 bg-emerald-300 rounded-xs" />
            <span>Personal Baseline (Mean ± 1σ)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-4 h-1.5 bg-stone-200 border border-dashed border-stone-400 rounded-xs" />
            <span>Lab Reference Interval</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rotate-45 bg-amber-600 inline-block" />
            <span>Clinical Event Marker</span>
          </div>
        </div>

        {/* Interactive SVG Chart Canvas */}
        <div className="w-full overflow-x-auto">
          <div className="min-w-[640px]">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-60 overflow-visible">
              {/* Population Reference Interval Band (if defined) */}
              {metricInfo.refLow !== undefined && metricInfo.refHigh !== undefined && (
                <rect
                  x={paddingX}
                  y={getY(metricInfo.refHigh)}
                  width={chartWidth - 2 * paddingX}
                  height={Math.max(2, getY(metricInfo.refLow) - getY(metricInfo.refHigh))}
                  fill="#F5F2EB"
                  opacity={0.6}
                  stroke="#E7E2D8"
                  strokeDasharray="4 4"
                />
              )}

              {/* Personal Baseline Band (Mean ± 1 StdDev) */}
              {personalBaseline && (
                <rect
                  x={paddingX}
                  y={getY(personalBaseline.mean + personalBaseline.stdDev)}
                  width={chartWidth - 2 * paddingX}
                  height={Math.max(2, getY(personalBaseline.mean - personalBaseline.stdDev) - getY(personalBaseline.mean + personalBaseline.stdDev))}
                  fill="#E8F2EC"
                  opacity={0.7}
                />
              )}

              {/* Baseline Mean Horizontal Guide */}
              {personalBaseline && (
                <line
                  x1={paddingX}
                  y1={getY(personalBaseline.mean)}
                  x2={chartWidth - paddingX}
                  y2={getY(personalBaseline.mean)}
                  stroke="#1E3A2F"
                  strokeWidth="1.5"
                  strokeDasharray="2 2"
                  opacity={0.6}
                />
              )}

              {/* Data trajectory line */}
              {pathD && (
                <path
                  d={pathD}
                  fill="none"
                  stroke="#1E3A2F"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Data Points */}
              {points.map((p, idx) => (
                <g key={idx} className="cursor-pointer group">
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={5}
                    className="fill-[#1E3A2F] stroke-white stroke-2 group-hover:r-7 transition-all"
                  />
                  {/* Tooltip & Value Label */}
                  <text
                    x={p.x}
                    y={p.y - 10}
                    textAnchor="middle"
                    className="text-[11px] font-mono font-bold fill-[#1C1E21] opacity-90 group-hover:opacity-100"
                  >
                    {p.obs.value}
                  </text>
                  <text
                    x={p.x}
                    y={chartHeight - 8}
                    textAnchor="middle"
                    className="text-[10px] font-mono fill-[#8C8678]"
                  >
                    {p.obs.timestamp.split('T')[0].slice(2)}
                  </text>
                </g>
              ))}

              {/* Event Markers along bottom */}
              {eventMarkers.slice(0, 5).map((ev, i) => {
                const posX = paddingX + ((i + 0.5) / 5) * (chartWidth - 2 * paddingX);
                return (
                  <g
                    key={ev.id}
                    onClick={() => setSelectedRecord(ev)}
                    className="cursor-pointer group"
                  >
                    <line
                      x1={posX}
                      y1={paddingY}
                      x2={posX}
                      y2={chartHeight - paddingY}
                      stroke={ev.recordType === 'medication' ? '#D97706' : '#E11D48'}
                      strokeWidth="1"
                      strokeDasharray="3 3"
                      opacity={0.7}
                    />
                    <polygon
                      points={`${posX},${paddingY - 4} ${posX - 5},${paddingY - 12} ${posX + 5},${paddingY - 12}`}
                      fill={ev.recordType === 'medication' ? '#D97706' : '#E11D48'}
                    />
                    <title>{`${ev.date}: ${ev.title}`}</title>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Discrete Recorded Observations */}
        <div className="pt-4 border-t border-[#E7E2D8]">
          <span className="text-xs font-semibold text-[#7A7467] block mb-3">
            Discrete recorded observations ({metricObservations.length})
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
            {metricObservations.map((obs) => {
              const isDeviation = personalBaseline && Math.abs(obs.value - personalBaseline.mean) > 1.8 * personalBaseline.stdDev;
              return (
                <div
                  key={obs.id}
                  className={`p-3 rounded-xl border text-xs ${
                    isDeviation ? 'bg-amber-50/60 border-amber-200' : 'bg-[#FAF7F0] border-[#E7E2D8]'
                  }`}
                >
                  <div className="flex items-center justify-between text-[#7A7467] font-mono">
                    <span>{obs.timestamp.split('T')[0]}</span>
                    <span className="text-[10px]">{obs.source}</span>
                  </div>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-base font-bold font-mono text-[#1C1E21]">
                      {obs.value} {obs.unit}
                    </span>
                    {isDeviation && (
                      <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                        Deviation
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Statistically Supported Candidate Relationships */}
      {relatedPatterns.length > 0 && (
        <section className="space-y-4">
          <SectionHeader
            title={`Supported Patterns for ${metricInfo.label}`}
            subtitle="Longitudinal relationships detected involving this biomarker."
          />

          <div className="space-y-3">
            {relatedPatterns.map((pat) => (
              <Card
                key={pat.id}
                variant="interactive"
                onClick={() => setSelectedPattern(pat)}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 group"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 text-xs">
                    <Badge variant="neutral">
                      {pat.patternType.replace(/_/g, ' ')}
                    </Badge>
                    <span className="text-[#7A7467] font-mono text-[11px]">{pat.windowStart} → {pat.windowEnd}</span>
                  </div>
                  <h3 className="font-editorial text-lg font-semibold text-[#1C1E21] group-hover:text-[#1E3A2F] transition-colors">
                    {pat.plainTitle || pat.title}
                  </h3>
                  <p className="text-xs text-[#656054] max-w-2xl leading-relaxed">
                    {pat.shortSummary || pat.observation}
                  </p>
                </div>

                <div className="shrink-0 flex items-center space-x-1.5 text-xs text-[#1E3A2F] font-semibold">
                  <span>Inspect evidence</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Expandable Relationship Map */}
      <Card variant="subtle" className="space-y-4">
        <div
          onClick={() => setShowRelationshipMap(!showRelationshipMap)}
          className="flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center space-x-3">
            <GitBranch className="w-5 h-5 text-[#1E3A2F]" />
            <div>
              <h2 className="font-editorial text-lg font-semibold text-[#1C1E21]">
                Longitudinal Factor Relationship Map
              </h2>
              <p className="text-xs text-[#7A7467]">
                Visual synthesis of connected medication adjustments, biomarker shifts, and symptoms.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setShowRelationshipMap(!showRelationshipMap);
            }}
          >
            {showRelationshipMap ? 'Collapse Map' : 'Expand Map'}
          </Button>
        </div>

        {showRelationshipMap && (
          <div className="pt-4 border-t border-[#E7E2D8] space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-center">
              <div className="bg-white p-3.5 rounded-xl border border-[#E7E2D8]">
                <span className="text-[11px] font-semibold text-amber-800">
                  1. Clinical Trigger
                </span>
                <h4 className="font-editorial text-sm font-semibold text-[#1C1E21] mt-1">
                  Atorvastatin Titration
                </h4>
                <p className="text-xs text-[#656054] mt-0.5">
                  20mg → 40mg adjustment
                </p>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-[#E7E2D8]">
                <span className="text-[11px] font-semibold text-rose-800">
                  2. Acute Biomarker
                </span>
                <h4 className="font-editorial text-sm font-semibold text-[#1C1E21] mt-1">
                  Creatine Kinase (CPK)
                </h4>
                <p className="text-xs text-[#656054] mt-0.5">
                  Surge to 312 U/L (z = +3.42)
                </p>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-[#E7E2D8]">
                <span className="text-[11px] font-semibold text-indigo-800">
                  3. Autonomic Telemetry
                </span>
                <h4 className="font-editorial text-sm font-semibold text-[#1C1E21] mt-1">
                  Nocturnal HRV Drop
                </h4>
                <p className="text-xs text-[#656054] mt-0.5">
                  -38% dip below 30-day baseline
                </p>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-[#E7E2D8]">
                <span className="text-[11px] font-semibold text-[#1C1E21]">
                  4. Patient Experience
                </span>
                <h4 className="font-editorial text-sm font-semibold text-[#1C1E21] mt-1">
                  Proximal Myalgias
                </h4>
                <p className="text-xs text-[#656054] mt-0.5">
                  Quadriceps soreness 8-day lag
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-white rounded-xl border border-[#E7E2D8] text-xs text-[#656054] leading-relaxed">
              <span className="font-semibold text-[#1C1E21]">Relationship Synthesis:</span> Across two independent years (2024 & 2025), Atorvastatin adjustments were followed by an 8-day latent window before CPK elevations and proximal myalgia reports, with nocturnal autonomic depression appearing 48 hours prior.
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
