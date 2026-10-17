import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'subtle' | 'interactive';
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  children,
  className = '',
  ...props
}) => {
  const variantClasses = {
    default: 'bg-white border border-[#E7E2D8] shadow-2xs',
    subtle: 'bg-[#FAF7F0] border border-[#E7E2D8]',
    interactive: 'bg-white border border-[#E7E2D8] hover:border-[#C5BFB0] shadow-2xs cursor-pointer transition-colors',
  }[variant];

  return (
    <div
      className={`rounded-xl p-5 sm:p-6 ${variantClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
