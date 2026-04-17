import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const Badge = ({ children, variant = 'active', className }) => {
  const variants = {
    active: 'status-badge-active',
    discharged: 'status-badge-discharged',
    critical: 'bg-red-100 text-red-600',
    moderate: 'bg-yellow-100 text-yellow-600',
  };

  return (
    <span className={twMerge('status-badge', variants[variant], className)}>
      {children}
    </span>
  );
};

export const Button = ({ children, variant = 'primary', icon: Icon, className, ...props }) => {
  const variants = {
    primary: 'btn-primary',
    outline: 'border-2 border-[#01A3FF] bg-white text-[#01A3FF] hover:bg-sky-50',
    success: 'bg-[#13C363] text-white hover:bg-[#11AD58] border-none shadow-lg shadow-emerald-100',
    danger: 'border border-red-500 text-red-500 hover:bg-red-50',
  };

  return (
    <button className={twMerge('flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors', variants[variant], className)} {...props}>
      {Icon && <Icon size={18} />}
      {children}
    </button>
  );
};

export const Card = ({ title, children, className, action }) => {
  return (
    <div className={twMerge('card', className)}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-5">
          {title && <h3 className="font-bold text-text-primary text-[15px]">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
};
