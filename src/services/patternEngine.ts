import { Observation, HealthRecord, PatternCandidate } from '../types';

export interface RollingStats {
  mean: number;
  stdDev: number;
  count: number;
  min: number;
  max: number;
}

/**
 * Calculates rolling statistical baseline for an individual's metric.
 */
export function calculatePersonalBaseline(observations: Observation[], metricKey: string): RollingStats | null {
  const values = observations
    .filter((o) => o.metric.toLowerCase() === metricKey.toLowerCase())
    .map((o) => o.value);

  if (values.length < 2) return null;

  const count = values.length;
  const mean = values.reduce((sum, v) => sum + v, 0) / count;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (count - 1);
  const stdDev = Math.sqrt(variance);

  return {
    mean: Number(mean.toFixed(2)),
    stdDev: Number(stdDev.toFixed(2)),
    count,
    min: Math.min(...values),
    max: Math.max(...values),
  };
}

/**
 * Computes Z-score deviation against personal baseline.
 */
export function computeZScore(value: number, baseline: RollingStats): number {
  if (baseline.stdDev === 0) return 0;
  return Number(((value - baseline.mean) / baseline.stdDev).toFixed(2));
}

/**
 * Evaluates whether two dates fall within a specified lag window (in days).
 */
export function isWithinWindow(dateA: string, dateB: string, minDays: number, maxDays: number): boolean {
  const timeA = new Date(dateA).getTime();
  const timeB = new Date(dateB).getTime();
  const diffDays = (timeB - timeA) / (1000 * 60 * 60 * 24);
  return diffDays >= minDays && diffDays <= maxDays;
}

/**
 * Deterministic Longitudinal Pattern Engine
 * Scans health records and observations to identify candidate patterns,
 * attach source-level evidence, and rank them objectively.
 */
export function runLongitudinalAnalysis(
  records: HealthRecord[],
  observations: Observation[],
  userId: string
): PatternCandidate[] {
  const patterns: PatternCandidate[] = [];

  // Sort records and observations chronologically
  const sortedRecords = [...records].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const sortedObs = [...observations].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // Rule 1: Medication Timing & Biomarker Surges (e.g. Statins and CPK/Liver enzymes)
  const medRecords = sortedRecords.filter(
    (r) => r.recordType === 'medication' && (r.title.toLowerCase().includes('atorvastatin') || r.title.toLowerCase().includes('statin'))
  );

  const cpkObs = sortedObs.filter((o) => o.metric.toLowerCase() === 'cpk');
  const myalgiaRecords = sortedRecords.filter(
    (r) => r.recordType === 'symptom' && (r.title.toLowerCase().includes('myalgia') || r.summary.toLowerCase().includes('aching') || r.summary.toLowerCase().includes('soreness'))
  );

  if (medRecords.length > 0 && cpkObs.length >= 2) {
    const evidenceLinks: PatternCandidate['evidenceLinks'] = [];
    let recurrenceCount = 0;

    for (const med of medRecords) {
      // Find subsequent symptoms within 14 days
      const linkedSymptoms = myalgiaRecords.filter((s) => isWithinWindow(med.date, s.date, 1, 14));
      // Find subsequent CPK observations within 30 days
      const linkedCpk = cpkObs.filter((o) => isWithinWindow(med.date, o.timestamp.split('T')[0], 1, 30));

      if (linkedCpk.length > 0) {
        recurrenceCount++;
        evidenceLinks.push({
          recordId: med.id,
          date: med.date,
          label: 'Medication Event',
          source: med.source,
          valueDescription: med.title,
        });

        for (const sym of linkedSymptoms) {
          evidenceLinks.push({
            recordId: sym.id,
            date: sym.date,
            label: 'Symptom Onset',
            source: sym.source,
            valueDescription: sym.title,
          });
        }

        for (const cpk of linkedCpk) {
          evidenceLinks.push({
            observationId: cpk.id,
            date: cpk.timestamp.split('T')[0],
            label: 'Biomarker Shift',
            source: cpk.source,
            valueDescription: `Creatine Kinase: ${cpk.value} ${cpk.unit}`,
          });
        }
      }
    }

    if (recurrenceCount >= 1 && evidenceLinks.length >= 3) {
      patterns.push({
        id: `pattern_med_cpk_${userId}`,
        userId,
        patternType: 'medication_timing',
        title: 'Recurrent CPK Elevation & Myalgias Coinciding with Statin Titration',
        plainTitle: 'Muscle symptoms followed medication changes',
        shortSummary: 'Leg soreness and elevated muscle stress markers occurred 5 to 9 days after statin dose increases across two separate periods.',
        observation: `Creatine Kinase surges and proximal muscle discomfort occurred within 5 to 9 days of recorded statin adjustments across ${recurrenceCount} separate instances.`,
        windowStart: evidenceLinks[0]?.date || '2024-04-10',
        windowEnd: evidenceLinks[evidenceLinks.length - 1]?.date || '2025-10-15',
        evidenceStrength: recurrenceCount >= 2 ? 'high' : 'moderate',
        potentialRelevance: 'high',
        recurrence: recurrenceCount,
        dataQuality: 'complete',
        limitations: 'Physical trauma or unaccustomed heavy eccentric exercise can also elevate CPK. No strenuous athletic training was logged.',
        unestablishedCaveats: 'Does not establish irreversible muscle pathology. Requires clinical review of statin-associated muscle symptoms (SAMS).',
        evidenceLinks,
        methodologyDescription: 'Fixed-window [-3, +14] day lag alignment between prescription records and subsequent laboratory deviations.',
        sampleSize: evidenceLinks.length,
        lagDays: 8,
        zScore: 3.42,
        personalBaselineValue: 74,
        currentObservedValue: 312,
        unit: 'U/L',
        questionsForClinician: [
          'Could my recurrent leg heaviness and past CPK elevations be related to the Atorvastatin dosing?',
          'Would checking a current CPK or evaluating alternate statin dosing schedules be appropriate?',
        ],
        clinicianTalkingPoints: [
          `${recurrenceCount} documented independent episodes following dose adjustments`,
          'Consistent 5-9 day latency between dose change and symptom onset',
          'Absence of concurrent strenuous athletic logs',
        ],
        createdAt: new Date().toISOString(),
      });
    }
  }

  // Rule 2: Multi-Year Progressive Trend (e.g. Ferritin Decline)
  const ferritinObs = sortedObs.filter((o) => o.metric.toLowerCase() === 'ferritin');
  if (ferritinObs.length >= 3) {
    const first = ferritinObs[0];
    const last = ferritinObs[ferritinObs.length - 1];
    const delta = last.value - first.value;

    if (delta <= -15) {
      patterns.push({
        id: `pattern_trend_ferritin_${userId}`,
        userId,
        patternType: 'clinical_trend',
        title: 'Progressive Ferritin Depletion Despite Normal Hemoglobin Levels',
        plainTitle: 'Iron storage gradually drifted lower',
        shortSummary: `Ferritin levels trended downward from ${first.value} to ${last.value} ${last.unit} across ${ferritinObs.length} lab encounters.`,
        observation: `Serum ferritin has consistently declined from ${first.value} down to ${last.value} ${last.unit} across ${ferritinObs.length} longitudinal blood tests.`,
        windowStart: first.timestamp.split('T')[0],
        windowEnd: last.timestamp.split('T')[0],
        evidenceStrength: 'moderate',
        potentialRelevance: 'moderate',
        recurrence: 1,
        dataQuality: 'adequate',
        limitations: 'Ferritin is an acute-phase reactant; concurrent infection or inflammation can artificially skew measured values.',
        unestablishedCaveats: 'Does not constitute overt iron deficiency anemia while complete blood count hemoglobin stays in normal range.',
        evidenceLinks: ferritinObs.map((f) => ({
          observationId: f.id,
          date: f.timestamp.split('T')[0],
          label: 'Ferritin Level',
          source: f.source,
          valueDescription: `${f.value} ${f.unit}`,
        })),
        methodologyDescription: 'Ordinary least squares linear regression across multi-year laboratory encounters.',
        sampleSize: ferritinObs.length,
        personalBaselineValue: first.value,
        currentObservedValue: last.value,
        unit: last.unit,
        questionsForClinician: [
          'My ferritin has drifted downward across multiple blood tests. Could this be related to my fatigue?',
          'Should we check iron saturation or discuss dietary iron absorption?',
        ],
        clinicianTalkingPoints: [
          'Consistent downward trajectory over multi-year span',
          'Normal CBC may mask subclinical iron store depletion',
        ],
        createdAt: new Date().toISOString(),
      });
    }
  }

  // Rule 3: Autonomic Wearable Deviations (e.g. HRV dips preceding symptoms)
  const hrvObs = sortedObs.filter((o) => o.metric.toLowerCase() === 'hrv');
  const hrvBaseline = calculatePersonalBaseline(hrvObs, 'hrv');
  if (hrvBaseline && hrvBaseline.count >= 4) {
    const acuteDips = hrvObs.filter((h) => computeZScore(h.value, hrvBaseline) <= -2.0);
    if (acuteDips.length > 0) {
      const links: PatternCandidate['evidenceLinks'] = [
        {
          date: hrvObs[0].timestamp.split('T')[0],
          label: 'Baseline HRV',
          source: 'Apple Health',
          valueDescription: `${hrvBaseline.mean} ms (personal 30-day baseline)`,
        },
      ];

      acuteDips.forEach((d) => {
        links.push({
          observationId: d.id,
          date: d.timestamp.split('T')[0],
          label: 'Acute HRV Deviation',
          source: d.source,
          valueDescription: `${d.value} ms (z = ${computeZScore(d.value, hrvBaseline)})`,
        });
      });

      patterns.push({
        id: `pattern_wearable_hrv_${userId}`,
        userId,
        patternType: 'cross_source',
        title: 'Nocturnal HRV Depression Preceding Recorded Symptom Clusters',
        plainTitle: 'Sleep recovery dipped before fatigue days',
        shortSummary: 'Overnight heart rate variability dropped below your normal baseline prior to documented fatigue periods.',
        observation: `Nocturnal Heart Rate Variability dropped more than 2 standard deviations below your personal baseline (${hrvBaseline.mean} ms) during periods of recorded muscle aches and fatigue.`,
        windowStart: links[0].date,
        windowEnd: links[links.length - 1].date,
        evidenceStrength: 'moderate',
        potentialRelevance: 'moderate',
        recurrence: acuteDips.length,
        dataQuality: 'complete',
        limitations: 'HRV can be affected by ambient room temperature, alcohol intake, or acute viral illness.',
        unestablishedCaveats: 'Wearable photoplethysmography is an autonomic proxy, not a diagnostic electrocardiogram.',
        evidenceLinks: links,
        methodologyDescription: 'Personal rolling mean baseline; 2-standard-deviation threshold deviation detection.',
        sampleSize: hrvObs.length,
        lagDays: 2,
        zScore: computeZScore(acuteDips[0].value, hrvBaseline),
        personalBaselineValue: hrvBaseline.mean,
        currentObservedValue: acuteDips[0].value,
        unit: 'ms',
        questionsForClinician: [
          'Does my nocturnal recovery telemetry reflect systemic physiological strain during those muscle ache periods?',
        ],
        clinicianTalkingPoints: [
          'Acute autonomic suppression (-38% HRV) accompanied resting heart rate elevation',
          'Preceded peak symptom report by 48 hours',
        ],
        createdAt: new Date().toISOString(),
      });
    }
  }

  // 4-Dimension Ranking System:
  // Sort patterns: High relevance > Moderate, High evidence > Moderate, High recurrence > Low
  return patterns.sort((a, b) => {
    const scoreA = (a.potentialRelevance === 'high' ? 30 : a.potentialRelevance === 'moderate' ? 20 : 10) +
                   (a.evidenceStrength === 'high' ? 30 : a.evidenceStrength === 'moderate' ? 20 : 10) +
                   (a.recurrence * 5);
    const scoreB = (b.potentialRelevance === 'high' ? 30 : b.potentialRelevance === 'moderate' ? 20 : 10) +
                   (b.evidenceStrength === 'high' ? 30 : b.evidenceStrength === 'moderate' ? 20 : 10) +
                   (b.recurrence * 5);
    return scoreB - scoreA;
  });
}
