import React, { useState } from 'react';
import { useHealth } from '../context/HealthContext';
import { PageHeader } from './common/PageHeader';
import { SectionHeader } from './common/SectionHeader';
import { Card } from './common/Card';
import { Badge } from './common/Badge';
import { Button } from './common/Button';
import {
  Share2,
  Download,
  Activity,
  Copy,
  Check,
} from 'lucide-react';

export const ProfileView: React.FC = () => {
  const {
    currentUser,
    patient,
    connectedProviders,
    toggleProviderStatus,
    records,
    observations,
    patterns,
    signInWithGoogle,
  } = useHealth();

  const [copiedShareLink, setCopiedShareLink] = useState(false);
  const [clinicianToken] = useState('aura_share_ev7204_exp2026');

  const handleCopyShareLink = () => {
    const link = `${window.location.origin}/?clinician_token=${clinicianToken}&patient=${patient.uid}`;
    navigator.clipboard.writeText(link);
    setCopiedShareLink(true);
    setTimeout(() => setCopiedShareLink(false), 2500);
  };

  const handleExportData = () => {
    const exportBundle = {
      patient,
      exportTimestamp: new Date().toISOString(),
      sourceSummary: `${records.length} records, ${observations.length} observations, ${patterns.length} patterns`,
      records,
      observations,
      patterns,
    };

    const blob = new Blob([JSON.stringify(exportBundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AURA_Health_Record_${patient.mrn}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
      {/* Standardized Header */}
      <PageHeader
        title="Profile & Connected Sources"
        subtitle="Manage authorized health data providers, privacy controls, and data export."
      />

      {/* Patient Profile Card */}
      <Card variant="default" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E7E2D8] pb-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full bg-[#1E3A2F] text-white flex items-center justify-center font-editorial text-base font-bold shrink-0">
              {patient.displayName.split(' ').map((n) => n[0]).join('')}
            </div>
            <div>
              <h2 className="font-editorial text-xl sm:text-2xl font-semibold text-[#1C1E21]">
                {patient.displayName}
              </h2>
              <div className="flex items-center space-x-3 text-xs text-[#7A7467] font-mono mt-0.5">
                <span>{patient.gender}, Age {patient.age}</span>
                <span>•</span>
                <span>MRN: {patient.mrn}</span>
              </div>
            </div>
          </div>

          <div>
            {currentUser ? (
              <div className="text-right">
                <Badge variant="verified">Google Account Linked</Badge>
                <p className="text-xs text-[#7A7467] mt-1 font-mono">{currentUser.email}</p>
              </div>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                onClick={signInWithGoogle}
              >
                Sign In with Google
              </Button>
            )}
          </div>
        </div>

        {/* Clinical Baseline Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-[#FAF7F0] p-4 rounded-xl border border-[#E7E2D8]">
            <span className="text-[#7A7467] font-semibold text-xs block mb-2">
              Documented diagnoses
            </span>
            <div className="space-y-1 text-[#1C1E21] font-medium">
              {patient.primaryConditions.map((c, i) => (
                <div key={i}>• {c}</div>
              ))}
            </div>
          </div>

          <div className="bg-[#FAF7F0] p-4 rounded-xl border border-[#E7E2D8]">
            <span className="text-[#7A7467] font-semibold text-xs block mb-2">
              Primary clinician
            </span>
            <div className="text-[#1C1E21] font-medium">
              <div>{patient.primaryPhysician}</div>
              <div className="text-[#7A7467] font-normal mt-0.5">Mount Sinai Health System</div>
            </div>
          </div>

          <div className="bg-[#FAF7F0] p-4 rounded-xl border border-[#E7E2D8]">
            <span className="text-[#7A7467] font-semibold text-xs block mb-2">
              Documented allergies
            </span>
            <div className="space-y-1 text-[#1C1E21] font-medium">
              {patient.allergies.map((a, i) => (
                <div key={i}>• {a}</div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Connected Health & Wearable Providers */}
      <section className="space-y-4">
        <SectionHeader
          title="Connected Data Providers"
          subtitle="Authorized feeds from wearable sensors, electronic health records, and commercial labs."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {connectedProviders.map((provider) => {
            const isConnected = provider.status === 'connected';
            return (
              <Card
                key={provider.id}
                variant="default"
                className="flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#FAF7F0] border border-[#E7E2D8] flex items-center justify-center text-[#1E3A2F]">
                        <Activity className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-[#1C1E21]">{provider.name}</h3>
                        <span className="text-[11px] text-[#7A7467] capitalize">{provider.category}</span>
                      </div>
                    </div>

                    <Badge variant={isConnected ? 'verified' : 'neutral'}>
                      {isConnected ? 'Active Feed' : 'Disconnected'}
                    </Badge>
                  </div>

                  <p className="text-xs text-[#656054] mt-2 leading-relaxed">
                    <span className="font-medium text-[#1C1E21]">Provided:</span>{' '}
                    {provider.metricsProvided.join(', ')}
                  </p>
                  <p className="text-[11px] text-[#8C8678] mt-1 font-mono">
                    Last sync: {provider.lastSync}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[#E7E2D8]">
                  <span className="text-[11px] text-[#7A7467]">
                    {provider.isDemo ? 'Demonstration feed' : 'Live authorized'}
                  </span>
                  <Button
                    variant={isConnected ? 'danger' : 'secondary'}
                    size="sm"
                    onClick={() => toggleProviderStatus(provider.id)}
                  >
                    {isConnected ? 'Revoke Access' : 'Connect Feed'}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Clinician Access & Data Sharing */}
      <Card variant="default" className="space-y-4">
        <div className="flex items-center space-x-3">
          <Share2 className="w-5 h-5 text-[#1E3A2F]" />
          <div>
            <h2 className="font-editorial text-xl font-semibold text-[#1C1E21]">
              Clinician Direct Access Sharing
            </h2>
            <p className="text-xs text-[#7A7467]">
              Provide Dr. Sarah Lin or your clinical team read-only access to inspect your longitudinal evidence timeline.
            </p>
          </div>
        </div>

        <div className="bg-[#FAF7F0] p-4 rounded-xl border border-[#E7E2D8] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
          <div>
            <div className="font-medium text-[#1C1E21]">Secure Clinician Review Token</div>
            <div className="text-[#7A7467] font-mono mt-0.5">{clinicianToken} (Valid for 30 days)</div>
          </div>

          <Button
            variant="primary"
            size="sm"
            icon={copiedShareLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            onClick={handleCopyShareLink}
          >
            {copiedShareLink ? 'Link Copied' : 'Copy Review Link'}
          </Button>
        </div>
      </Card>

      {/* Export & Data Integrity */}
      <Card variant="subtle" className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-editorial text-xl font-semibold text-[#1C1E21]">
            Export & Data Integrity
          </h2>
          <p className="text-xs text-[#7A7467] mt-0.5">
            Export your structured longitudinal health timeline in auditable JSON format.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={<Download className="w-4 h-4" />}
          onClick={handleExportData}
        >
          Export Data Bundle
        </Button>
      </Card>
    </div>
  );
};
