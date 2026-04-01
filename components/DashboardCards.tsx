import React from 'react';

interface CardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const GlassCard: React.FC<CardProps> = ({ title, children, className = '' }) => {
  return (
    <div className={`bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 text-white shadow-xl ${className}`}>
      <h3 className="text-xl font-semibold mb-4 text-white/90 border-b border-white/10 pb-2">{title}</h3>
      <div className="text-white/80">{children}</div>
    </div>
  );
};

export const StatItem: React.FC<{ label: string; value: string | number; unit?: string; icon?: React.ReactNode }> = ({ label, value, unit, icon }) => (
    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg mb-2 hover:bg-white/10 transition-colors">
        <div className="flex items-center gap-3">
            {icon && <span className="text-2xl">{icon}</span>}
            <span className="text-sm font-medium text-gray-200">{label}</span>
        </div>
        <div className="text-lg font-bold text-white">
            {value}
            {unit && <span className="text-xs ml-1 opacity-70">{unit}</span>}
        </div>
    </div>
);
