import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  action,
  children,
}) => {
  return (
    <div className="border-b border-[#E7E2D8] pb-5 sm:pb-6 mb-6 sm:mb-8">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="font-editorial text-2xl sm:text-3xl lg:text-4xl text-[#1C1E21] font-normal tracking-tight break-words">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1.5 text-xs sm:text-sm lg:text-base text-[#656054] leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
        {action && (
          <div className="shrink-0 flex items-center flex-wrap gap-2 pt-1 md:pt-0">
            {action}
          </div>
        )}
      </div>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
};
