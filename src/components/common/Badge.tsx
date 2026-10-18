import React from 'react';
import { Pill, Activity, Thermometer, FileText, CheckCircle2, FileCheck } from 'lucide-react';
import { RecordType } from '../../types';

export interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'prescription' | 'medication' | 'lab_report' | 'symptom' | 'wearable_summary' | 'clinical_note' | 'other_document' | 'neutral' | 'verified' | 'outline';
  recordType?: RecordType;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant,
  recordType,
  className = '',
}) => {
  const type = variant || (recordType as string) || 'neutral';

  let icon = null;
  let styleClasses = 'bg-[#FAF7F0] text-[#656054] border-[#E7E2D8]';

  if (type === 'prescription') {
    icon = <FileCheck className="w-3 h-3 text-indigo-700 mr-1 shrink-0" />;
    styleClasses = 'bg-indigo-50 text-indigo-900 border-indigo-200';
  } else if (type === 'medication') {
    icon = <Pill className="w-3 h-3 text-amber-700 mr-1 shrink-0" />;
    styleClasses = 'bg-amber-50 text-amber-900 border-amber-200';
  } else if (type === 'lab_report') {
    icon = <Activity className="w-3 h-3 text-emerald-700 mr-1 shrink-0" />;
    styleClasses = 'bg-emerald-50 text-emerald-900 border-emerald-200';
  } else if (type === 'symptom') {
    icon = <Thermometer className="w-3 h-3 text-rose-700 mr-1 shrink-0" />;
    styleClasses = 'bg-rose-50 text-rose-900 border-rose-200';
  } else if (type === 'clinical_note' || type === 'wearable_summary') {
    icon = <FileText className="w-3 h-3 text-stone-700 mr-1 shrink-0" />;
    styleClasses = 'bg-stone-50 text-stone-900 border-stone-200';
  } else if (type === 'other_document') {
    icon = <FileText className="w-3 h-3 text-stone-600 mr-1 shrink-0" />;
    styleClasses = 'bg-[#FAF7F0] text-[#524E43] border-[#E7E2D8]';
  } else if (type === 'verified') {
    icon = <CheckCircle2 className="w-3 h-3 text-emerald-700 mr-1 shrink-0" />;
    styleClasses = 'bg-emerald-50 text-emerald-900 border-emerald-200';
  } else if (type === 'outline') {
    styleClasses = 'bg-transparent text-[#656054] border-[#E7E2D8]';
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border whitespace-nowrap shrink-0 ${styleClasses} ${className}`}
    >
      {icon}
      <span>{children}</span>
    </span>
  );
};
