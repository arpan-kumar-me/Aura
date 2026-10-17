import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1 text-xs gap-1.5 h-8',
    md: 'px-3.5 py-1.5 text-xs sm:text-sm gap-2 h-9',
    lg: 'px-4 py-2 text-sm gap-2 h-10',
  }[size];

  const variantClasses = {
    primary: 'bg-[#1E3A2F] text-white hover:bg-[#162C23] border border-transparent shadow-2xs',
    secondary: 'bg-[#FAF7F0] text-[#1C1E21] hover:bg-[#F2ECE0] border border-[#E7E2D8]',
    outline: 'bg-white text-[#1C1E21] hover:bg-[#FAF7F0] border border-[#D5CFC2]',
    ghost: 'bg-transparent text-[#656054] hover:text-[#1C1E21] hover:bg-[#FAF7F0]',
    danger: 'bg-white text-rose-700 hover:bg-rose-50 border border-rose-200',
  }[variant];

  return (
    <button
      disabled={disabled}
      className={`inline-flex items-center justify-center font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
};
