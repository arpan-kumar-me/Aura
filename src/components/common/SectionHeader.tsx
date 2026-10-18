import React from 'react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  action,
  className = '',
}) => {
  return (
    <div className={`flex items-start sm:items-baseline justify-between gap-3 sm:gap-4 mb-3.5 ${className}`}>
      <div>
        <h2 className="font-editorial text-xl sm:text-2xl font-semibold text-[#1C1E21] tracking-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-0.5 text-xs text-[#656054] leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};
