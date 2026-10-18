import React from 'react';
import { EvidenceLink } from '../../types';
import { ChevronRight } from 'lucide-react';

interface EvidenceListProps {
  evidenceLinks: EvidenceLink[];
  onSelectRecord?: (recordId?: string) => void;
  className?: string;
  compact?: boolean;
}

export const EvidenceList: React.FC<EvidenceListProps> = ({
  evidenceLinks,
  onSelectRecord,
  className = '',
  compact = false,
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {evidenceLinks.map((link, idx) => {
        const isClickable = Boolean(link.recordId && onSelectRecord);

        return (
          <div
            key={idx}
            onClick={() => {
              if (isClickable && link.recordId) {
                onSelectRecord?.(link.recordId);
              }
            }}
            className={`p-3 rounded-xl bg-[#FAF7F0] border border-[#E7E2D8] flex items-center justify-between transition-colors ${
              isClickable ? 'hover:border-[#1E3A2F] cursor-pointer group' : ''
            }`}
          >
            <div className="flex items-center space-x-3 text-xs overflow-hidden min-w-0 flex-1">
              <span className="font-mono text-[#7A7467] font-semibold shrink-0">
                {link.date}
              </span>
              <div className="w-1.5 h-1.5 rounded-full bg-[#1E3A2F] shrink-0" />
              <div className="truncate">
                <span className="font-medium text-[#1C1E21]">{link.label}</span>
                <span className="text-[#656054] ml-1.5">— {link.valueDescription}</span>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-[11px] text-[#8C8678] font-mono shrink-0 pl-3">
              <span className="hidden sm:inline">{link.source}</span>
              {isClickable && (
                <ChevronRight className="w-3.5 h-3.5 text-[#A59F92] group-hover:text-[#1E3A2F] transition-colors" />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
