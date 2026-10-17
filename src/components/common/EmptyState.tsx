import React from 'react';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div className={`p-8 text-center bg-[#FAF7F0] rounded-xl border border-[#E7E2D8] ${className}`}>
      {icon && <div className="flex justify-center mb-3 text-[#7A7467]">{icon}</div>}
      <h3 className="font-editorial text-base font-semibold text-[#1C1E21]">{title}</h3>
      <p className="mt-1 text-xs text-[#656054] max-w-sm mx-auto leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <div className="mt-4">
          <Button variant="outline" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};
