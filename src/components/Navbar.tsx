import React, { useState } from 'react';
import { useHealth } from '../context/HealthContext';
import {
  Compass,
  FileText,
  LineChart,
  UserCheck,
  Stethoscope,
  Plus,
  LogIn,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { Button } from './common/Button';

interface NavbarProps {
  currentTab: 'story' | 'records' | 'trends' | 'profile';
  setCurrentTab: (tab: 'story' | 'records' | 'trends' | 'profile') => void;
  isClinicianMode: boolean;
  setIsClinicianMode: (val: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  isClinicianMode,
  setIsClinicianMode,
}) => {
  const {
    currentUser,
    signInWithGoogle,
    signOut,
    setIsAddRecordModalOpen,
    patientMode,
    setPatientMode,
    resetDemoData,
  } = useHealth();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [resetFeedback, setResetFeedback] = useState(false);

  const handleResetDemo = () => {
    resetDemoData();
    setResetFeedback(true);
    setTimeout(() => setResetFeedback(false), 2000);
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-[#FBF9F5]/98 backdrop-blur-md border-b border-[#E7E2D8] select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
            {/* Left Section: Brand & Subtitle */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <button
                onClick={() => {
                  setIsClinicianMode(false);
                  setCurrentTab('story');
                }}
                className="flex items-baseline gap-2 cursor-pointer text-left group focus-visible:outline-none"
              >
                <span className="font-editorial text-2xl font-bold tracking-tight text-[#1E3A2F] group-hover:text-[#162C23] transition-colors">
                  AURA
                </span>
                <span className="hidden sm:inline-block h-3.5 w-px bg-[#E7E2D8]" />
                <span className="text-[11px] text-[#7A7467] font-medium tracking-wide hidden sm:inline-block whitespace-nowrap">
                  Longitudinal Health
                </span>
              </button>
            </div>

            {/* Center Section: Primary Navigation Tabs (Desktop >= 1024px) */}
            {!isClinicianMode && (
              <nav className="hidden lg:flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setCurrentTab('story')}
                  className={`flex items-center gap-1.5 px-3 h-9 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer shrink-0 ${
                    currentTab === 'story'
                      ? 'text-[#1E3A2F] bg-[#FAF7F0] border border-[#E7E2D8] font-semibold shadow-2xs'
                      : 'text-[#656054] hover:text-[#1C1E21] hover:bg-[#FAF7F0] border border-transparent'
                  }`}
                >
                  <Compass className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden xl:inline">Health </span>
                  <span>Story</span>
                </button>

                <button
                  onClick={() => setCurrentTab('records')}
                  className={`flex items-center gap-1.5 px-3 h-9 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer shrink-0 ${
                    currentTab === 'records'
                      ? 'text-[#1E3A2F] bg-[#FAF7F0] border border-[#E7E2D8] font-semibold shadow-2xs'
                      : 'text-[#656054] hover:text-[#1C1E21] hover:bg-[#FAF7F0] border border-transparent'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  <span>Records</span>
                </button>

                <button
                  onClick={() => setCurrentTab('trends')}
                  className={`flex items-center gap-1.5 px-3 h-9 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer shrink-0 ${
                    currentTab === 'trends'
                      ? 'text-[#1E3A2F] bg-[#FAF7F0] border border-[#E7E2D8] font-semibold shadow-2xs'
                      : 'text-[#656054] hover:text-[#1C1E21] hover:bg-[#FAF7F0] border border-transparent'
                  }`}
                >
                  <LineChart className="w-3.5 h-3.5 shrink-0" />
                  <span>Trends</span>
                </button>

                <button
                  onClick={() => setCurrentTab('profile')}
                  className={`flex items-center gap-1.5 px-3 h-9 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer shrink-0 ${
                    currentTab === 'profile'
                      ? 'text-[#1E3A2F] bg-[#FAF7F0] border border-[#E7E2D8] font-semibold shadow-2xs'
                      : 'text-[#656054] hover:text-[#1C1E21] hover:bg-[#FAF7F0] border border-transparent'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5 shrink-0" />
                  <span>Profile</span>
                </button>
              </nav>
            )}

            {/* Right Section: Dataset, Status, View Switcher, Primary Action, Auth */}
            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
              {/* Dataset Selector (Visible on wide desktop >= 1280px) */}
              {!currentUser && (
                <div className="hidden xl:flex items-center bg-[#FAF7F0] p-0.5 rounded-lg border border-[#E7E2D8] text-xs h-9 shrink-0">
                  <button
                    onClick={() => setPatientMode('demo')}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors whitespace-nowrap ${
                      patientMode === 'demo'
                        ? 'bg-[#1E3A2F] text-white shadow-2xs font-semibold'
                        : 'text-[#656054] hover:text-[#1C1E21]'
                    }`}
                    title="Eleanor Vance curated longitudinal dataset"
                  >
                    Demo Patient
                  </button>
                  <button
                    onClick={() => setPatientMode('new_patient')}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors whitespace-nowrap ${
                      patientMode === 'new_patient'
                        ? 'bg-[#1E3A2F] text-white shadow-2xs font-semibold'
                        : 'text-[#656054] hover:text-[#1C1E21]'
                    }`}
                    title="Empty sandbox to upload and test new documents"
                  >
                    Sandbox
                  </button>
                </div>
              )}

              {/* Quiet Local Demo Indicator (Visible on ultra-wide desktop) */}
              <div
                className="hidden 2xl:flex items-center gap-1.5 px-2 py-1 text-xs text-[#524E43] whitespace-nowrap shrink-0"
                title="AURA No-Billing Demo Mode: Data persists in browser localStorage with zero cloud billing dependencies."
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0"></span>
                <span className="text-[11px] font-medium">Local Demo</span>
              </div>

              {/* Patient vs Clinician Mode Switcher */}
              <div className="flex items-center bg-[#FAF7F0] p-0.5 rounded-lg border border-[#E7E2D8] text-xs shrink-0 h-9">
                <button
                  onClick={() => setIsClinicianMode(false)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                    !isClinicianMode
                      ? 'bg-[#1E3A2F] text-white shadow-2xs font-semibold'
                      : 'text-[#656054] hover:text-[#1C1E21]'
                  }`}
                >
                  Patient
                </button>
                <button
                  onClick={() => setIsClinicianMode(true)}
                  className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                    isClinicianMode
                      ? 'bg-[#1E3A2F] text-white shadow-2xs font-semibold'
                      : 'text-[#656054] hover:text-[#1C1E21]'
                  }`}
                >
                  <Stethoscope className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline">Clinician</span>
                </button>
              </div>

              {/* Primary Add Record Button */}
              <Button
                variant="primary"
                size="sm"
                icon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => setIsAddRecordModalOpen(true)}
                className="h-9 whitespace-nowrap shrink-0"
              >
                <span className="hidden sm:inline">Add Record</span>
                <span className="sm:hidden">Add</span>
              </Button>

              {/* Sign In / User Profile */}
              {currentUser ? (
                <div className="flex items-center gap-1.5 pl-1.5 border-l border-[#E7E2D8] shrink-0">
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || 'User'}
                      className="w-7 h-7 rounded-full border border-[#D5CFC2]"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-[#1E3A2F] text-white flex items-center justify-center text-xs font-semibold">
                      {currentUser.displayName ? currentUser.displayName[0] : 'U'}
                    </div>
                  )}
                  <button
                    onClick={signOut}
                    title="Sign Out"
                    className="p-1 text-[#7A7467] hover:text-[#1C1E21] transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  icon={<LogIn className="w-3.5 h-3.5" />}
                  onClick={signInWithGoogle}
                  className="h-9 whitespace-nowrap shrink-0 hidden md:inline-flex"
                >
                  Sign In
                </Button>
              )}

              {/* Responsive Options Menu Toggle (Shown below xl to collapse lower-priority controls) */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="xl:hidden p-2 text-[#656054] hover:text-[#1C1E21] hover:bg-[#FAF7F0] rounded-lg border border-[#E7E2D8] transition-colors cursor-pointer shrink-0 h-9 w-9 flex items-center justify-center"
                title="Options and settings"
                aria-label="Toggle navigation menu"
              >
                {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Collapsible Options & Settings Panel (Tablet & Mobile) */}
          {isMobileMenuOpen && (
            <div className="xl:hidden border-t border-[#E7E2D8] py-4 space-y-3.5 bg-[#FBF9F5] text-xs">
              {/* Dataset Selection */}
              {!currentUser && (
                <div className="bg-[#FAF7F0] p-3 rounded-xl border border-[#E7E2D8] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#1C1E21]">Patient Dataset:</span>
                    <span className="text-[11px] text-[#7A7467]">
                      {patientMode === 'demo' ? 'Eleanor Vance (Multi-year)' : 'Empty Sandbox'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setPatientMode('demo');
                        setIsMobileMenuOpen(false);
                      }}
                      className={`p-2 rounded-lg text-xs font-medium cursor-pointer transition-colors text-left border ${
                        patientMode === 'demo'
                          ? 'bg-[#1E3A2F] text-white border-[#1E3A2F]'
                          : 'bg-white text-[#656054] border-[#E7E2D8] hover:bg-[#FAF7F0]'
                      }`}
                    >
                      <div className="font-semibold">Demo Patient</div>
                      <div className={`text-[10px] mt-0.5 ${patientMode === 'demo' ? 'text-white/80' : 'text-[#7A7467]'}`}>
                        Eleanor Vance (curated)
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        setPatientMode('new_patient');
                        setIsMobileMenuOpen(false);
                      }}
                      className={`p-2 rounded-lg text-xs font-medium cursor-pointer transition-colors text-left border ${
                        patientMode === 'new_patient'
                          ? 'bg-[#1E3A2F] text-white border-[#1E3A2F]'
                          : 'bg-white text-[#656054] border-[#E7E2D8] hover:bg-[#FAF7F0]'
                      }`}
                    >
                      <div className="font-semibold">Sandbox Patient</div>
                      <div className={`text-[10px] mt-0.5 ${patientMode === 'new_patient' ? 'text-white/80' : 'text-[#7A7467]'}`}>
                        Empty repository
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Status & Actions Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-1 pt-1">
                <div className="flex items-center gap-1.5 text-[#524E43]">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span>No-Billing Local Storage Active</span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleResetDemo}
                    className="inline-flex items-center gap-1 text-[11px] text-[#7A7467] hover:text-[#1E3A2F] cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>{resetFeedback ? 'Demo Reset!' : 'Reset Demo Data'}</span>
                  </button>

                  {!currentUser && (
                    <button
                      onClick={() => {
                        signInWithGoogle();
                        setIsMobileMenuOpen(false);
                      }}
                      className="text-[#1E3A2F] font-semibold hover:underline cursor-pointer text-xs"
                    >
                      Sign In with Google
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Fixed Mobile Bottom Tab Bar (Visible on screens < 1024px in Patient Mode) */}
      {!isClinicianMode && (
        <nav
          aria-label="Mobile navigation"
          className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#FBF9F5]/98 backdrop-blur-md border-t border-[#E7E2D8] py-1.5 px-3 flex items-center justify-around text-xs shadow-lg"
        >
          <button
            onClick={() => setCurrentTab('story')}
            className={`flex flex-col items-center justify-center min-w-[64px] min-h-[44px] py-1 px-2 rounded-lg transition-colors cursor-pointer ${
              currentTab === 'story'
                ? 'text-[#1E3A2F] font-semibold'
                : 'text-[#7A7467] hover:text-[#1C1E21]'
            }`}
          >
            <Compass className="w-4 h-4 mb-0.5 shrink-0" />
            <span className="text-[11px] leading-tight">Story</span>
          </button>

          <button
            onClick={() => setCurrentTab('records')}
            className={`flex flex-col items-center justify-center min-w-[64px] min-h-[44px] py-1 px-2 rounded-lg transition-colors cursor-pointer ${
              currentTab === 'records'
                ? 'text-[#1E3A2F] font-semibold'
                : 'text-[#7A7467] hover:text-[#1C1E21]'
            }`}
          >
            <FileText className="w-4 h-4 mb-0.5 shrink-0" />
            <span className="text-[11px] leading-tight">Records</span>
          </button>

          <button
            onClick={() => setCurrentTab('trends')}
            className={`flex flex-col items-center justify-center min-w-[64px] min-h-[44px] py-1 px-2 rounded-lg transition-colors cursor-pointer ${
              currentTab === 'trends'
                ? 'text-[#1E3A2F] font-semibold'
                : 'text-[#7A7467] hover:text-[#1C1E21]'
            }`}
          >
            <LineChart className="w-4 h-4 mb-0.5 shrink-0" />
            <span className="text-[11px] leading-tight">Trends</span>
          </button>

          <button
            onClick={() => setCurrentTab('profile')}
            className={`flex flex-col items-center justify-center min-w-[64px] min-h-[44px] py-1 px-2 rounded-lg transition-colors cursor-pointer ${
              currentTab === 'profile'
                ? 'text-[#1E3A2F] font-semibold'
                : 'text-[#7A7467] hover:text-[#1C1E21]'
            }`}
          >
            <UserCheck className="w-4 h-4 mb-0.5 shrink-0" />
            <span className="text-[11px] leading-tight">Profile</span>
          </button>
        </nav>
      )}
    </>
  );
};
