/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { HealthProvider, useHealth } from './context/HealthContext';
import { Navbar } from './components/Navbar';
import { HealthStoryView } from './components/HealthStoryView';
import { RecordsView } from './components/RecordsView';
import { TrendsView } from './components/TrendsView';
import { ProfileView } from './components/ProfileView';
import { ClinicianReviewView } from './components/ClinicianReviewView';
import { ContextualFindingModal } from './components/ContextualFindingModal';
import { RecordDetailDrawer } from './components/RecordDetailDrawer';
import { AddRecordModal } from './components/AddRecordModal';
import { ShieldCheck, Info } from 'lucide-react';

function AppContent() {
  const [currentTab, setCurrentTab] = useState<'story' | 'records' | 'trends' | 'profile'>('story');
  const [isClinicianMode, setIsClinicianMode] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#1C1E21] flex flex-col font-sans selection:bg-[#E3DFCE] selection:text-[#1E3A2F]">
      {/* Top Navigation */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        isClinicianMode={isClinicianMode}
        setIsClinicianMode={setIsClinicianMode}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {isClinicianMode ? (
          <ClinicianReviewView />
        ) : (
          <>
            {currentTab === 'story' && <HealthStoryView />}
            {currentTab === 'records' && <RecordsView />}
            {currentTab === 'trends' && <TrendsView />}
            {currentTab === 'profile' && <ProfileView />}
          </>
        )}
      </main>

      {/* Shared Overlays & Modals */}
      <ContextualFindingModal />
      <RecordDetailDrawer />
      <AddRecordModal />

      {/* Dignified Clinical Footer */}
      <footer className="border-t border-[#E7E2D8] bg-[#F7F4EC] py-8 text-xs text-[#7A7467]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-editorial text-sm font-bold text-[#1E3A2F]">AURA</span>
            <span>— Longitudinal Health Intelligence Platform</span>
          </div>

          <div className="flex items-center space-x-4 text-center sm:text-right text-[11px] text-[#8C8678]">
            <span className="flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>Evidence before explanation • ABAC Secured</span>
            </span>
            <span>•</span>
            <span>Supports clinical decisions; does not provide autonomous medical diagnosis</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <HealthProvider>
      <AppContent />
    </HealthProvider>
  );
}
