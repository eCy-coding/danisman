import React from 'react';
import { RESIDENCY_CONFIG, type ResidencyLocation } from '../../../lib/data-residency';

interface DataResidencyBadgeProps {
  location: ResidencyLocation;
  compact?: boolean;
  className?: string;
}

export const DataResidencyBadge: React.FC<DataResidencyBadgeProps> = ({
  location,
  compact = false,
  className = '',
}) => {
  const config = RESIDENCY_CONFIG[location];

  return (
    <span
      role="img"
      aria-label={config.description}
      className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ${className}`}
      style={{ backgroundColor: config.bgColor, color: config.color }}
    >
      <span aria-hidden="true">{config.icon}</span>
      {!compact && <span>{config.label}</span>}
    </span>
  );
};

interface ComplianceBadgeProps {
  label: string;
  status: 'active' | 'pending' | 'expired';
  className?: string;
}

const STATUS_COLORS = {
  active: { bg: '#16a34a', text: '#ffffff' },
  pending: { bg: '#d97706', text: '#ffffff' },
  expired: { bg: '#dc2626', text: '#ffffff' },
};

export const ComplianceBadge: React.FC<ComplianceBadgeProps> = ({
  label,
  status,
  className = '',
}) => {
  const colors = STATUS_COLORS[status];
  return (
    <span
      role="status"
      aria-label={`${label}: ${status}`}
      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${className}`}
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      {label}
    </span>
  );
};
