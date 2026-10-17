import React from 'react';
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
  Activity,
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
  const { currentUser, signInWithGoogle, signOut, setIsAddRecordModalOpen, connectedProviders } = useHealth();

  const connectedCount = connectedProviders.filter((p) => p.status === 'connected').length;

  return (
    <header className="sticky top-0 z-30 bg-[#FBF9F5]/95 backdrop-blur-md border-b border-[#E7E2D8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-15">
          {/* Logo & Brand Identity */}
          <div className="flex items-center space-x-6">
            <div
              onClick={() => {
                setIsClinicianMode(false);
                setCurrentTab('story');
              }}
              className="cursor-pointer group flex items-baseline space-x-2"
            >
              <span className="font-editorial text-2xl font-bold tracking-tight text-[#1E3A2F]">
                AURA
              </span>
              <span className="text-xs text-[#7A7467] font-medium hidden sm:inline-block">
                Longitudinal Health
              </span>
            </div>

            {/* Mode Switcher: Patient vs Clinician */}
            <div className="hidden md:flex items-center bg-[#FAF7F0] p-1 rounded-lg border border-[#E7E2D8]">
              <button
                onClick={() => setIsClinicianMode(false)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  !isClinicianMode
                    ? 'bg-[#1E3A2F] text-white shadow-2xs'
                    : 'text-[#656054] hover:text-[#1C1E21]'
                }`}
              >
                Patient Application
              </button>
              <button
                onClick={() => setIsClinicianMode(true)}
                className={`flex items-center space-x-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  isClinicianMode
                    ? 'bg-[#1E3A2F] text-white shadow-2xs'
                    : 'text-[#656054] hover:text-[#1C1E21]'
                }`}
              >
                <Stethoscope className="w-3.5 h-3.5" />
                <span>Clinician Review</span>
              </button>
            </div>
          </div>

          {/* Navigation Destinations (Only in Patient Mode) */}
          {!isClinicianMode && (
            <nav className="hidden lg:flex items-center space-x-1">
              <button
                onClick={() => setCurrentTab('story')}
                className={`flex items-center space-x-2 px-3 py-1.5 h-9 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                  currentTab === 'story'
                    ? 'text-[#1E3A2F] bg-[#FAF7F0] border border-[#E7E2D8] font-semibold'
                    : 'text-[#656054] hover:text-[#1C1E21] hover:bg-[#FAF7F0] border border-transparent'
                }`}
              >
                <Compass className="w-4 h-4" />
                <span>Health Story</span>
              </button>

              <button
                onClick={() => setCurrentTab('records')}
                className={`flex items-center space-x-2 px-3 py-1.5 h-9 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                  currentTab === 'records'
                    ? 'text-[#1E3A2F] bg-[#FAF7F0] border border-[#E7E2D8] font-semibold'
                    : 'text-[#656054] hover:text-[#1C1E21] hover:bg-[#FAF7F0] border border-transparent'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Records</span>
              </button>

              <button
                onClick={() => setCurrentTab('trends')}
                className={`flex items-center space-x-2 px-3 py-1.5 h-9 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                  currentTab === 'trends'
                    ? 'text-[#1E3A2F] bg-[#FAF7F0] border border-[#E7E2D8] font-semibold'
                    : 'text-[#656054] hover:text-[#1C1E21] hover:bg-[#FAF7F0] border border-transparent'
                }`}
              >
                <LineChart className="w-4 h-4" />
                <span>Trends</span>
              </button>

              <button
                onClick={() => setCurrentTab('profile')}
                className={`flex items-center space-x-2 px-3 py-1.5 h-9 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                  currentTab === 'profile'
                    ? 'text-[#1E3A2F] bg-[#FAF7F0] border border-[#E7E2D8] font-semibold'
                    : 'text-[#656054] hover:text-[#1C1E21] hover:bg-[#FAF7F0] border border-transparent'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>Profile & Sources</span>
              </button>
            </nav>
          )}

          {/* Right Action Bar */}
          <div className="flex items-center space-x-2.5">
            {/* Connected status badge */}
            <div
              onClick={() => {
                setIsClinicianMode(false);
                setCurrentTab('profile');
              }}
              className="hidden sm:flex items-center space-x-1.5 px-2.5 h-8 text-xs text-[#524E43] bg-[#FAF7F0] rounded-lg cursor-pointer hover:bg-[#F2ECE0] transition-colors border border-[#E7E2D8]"
              title="Manage connected data feeds"
            >
              <Activity className="w-3.5 h-3.5 text-[#1E3A2F]" />
              <span>{connectedCount} sources</span>
            </div>

            {/* Standard Add Record button */}
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => setIsAddRecordModalOpen(true)}
            >
              Add Record
            </Button>

            {/* Auth / User Status */}
            {currentUser ? (
              <div className="flex items-center space-x-2 pl-2 border-l border-[#E7E2D8]">
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
              >
                Sign In
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Navigation bar */}
        {!isClinicianMode && (
          <div className="lg:hidden flex items-center justify-around py-2 border-t border-[#E7E2D8] text-xs">
            <button
              onClick={() => setCurrentTab('story')}
              className={`flex flex-col items-center py-1 px-2 cursor-pointer ${
                currentTab === 'story' ? 'text-[#1E3A2F] font-semibold' : 'text-[#656054]'
              }`}
            >
              <Compass className="w-4 h-4 mb-0.5" />
              <span>Story</span>
            </button>
            <button
              onClick={() => setCurrentTab('records')}
              className={`flex flex-col items-center py-1 px-2 cursor-pointer ${
                currentTab === 'records' ? 'text-[#1E3A2F] font-semibold' : 'text-[#656054]'
              }`}
            >
              <FileText className="w-4 h-4 mb-0.5" />
              <span>Records</span>
            </button>
            <button
              onClick={() => setCurrentTab('trends')}
              className={`flex flex-col items-center py-1 px-2 cursor-pointer ${
                currentTab === 'trends' ? 'text-[#1E3A2F] font-semibold' : 'text-[#656054]'
              }`}
            >
              <LineChart className="w-4 h-4 mb-0.5" />
              <span>Trends</span>
            </button>
            <button
              onClick={() => setCurrentTab('profile')}
              className={`flex flex-col items-center py-1 px-2 cursor-pointer ${
                currentTab === 'profile' ? 'text-[#1E3A2F] font-semibold' : 'text-[#656054]'
              }`}
            >
              <UserCheck className="w-4 h-4 mb-0.5" />
              <span>Profile</span>
            </button>
            <button
              onClick={() => setIsClinicianMode(true)}
              className="flex flex-col items-center py-1 px-2 text-[#656054] cursor-pointer"
            >
              <Stethoscope className="w-4 h-4 mb-0.5" />
              <span>Clinician</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
