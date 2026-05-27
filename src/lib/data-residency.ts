export type ResidencyLocation = 'TR_LOCAL' | 'EU_GDPR' | 'US_SCC' | 'OTHER';

export interface ResidencyConfig {
  label: string;
  color: string;
  bgColor: string;
  description: string;
  icon: string;
}

export const RESIDENCY_CONFIG: Record<ResidencyLocation, ResidencyConfig> = {
  TR_LOCAL: {
    label: 'TR İçi',
    color: '#ffffff',
    bgColor: '#16a34a',
    description: 'Türkiye sınırları içinde saklanır (KVKK m.12)',
    icon: '🇹🇷',
  },
  EU_GDPR: {
    label: 'AB GDPR',
    color: '#ffffff',
    bgColor: '#2563eb',
    description: "AB'de işlenir, GDPR kapsamında",
    icon: '🇪🇺',
  },
  US_SCC: {
    label: 'ABD SCC',
    color: '#1f2937',
    bgColor: '#fbbf24',
    description: "SCC mekanizmasıyla ABD'ye aktarım",
    icon: '📋',
  },
  OTHER: {
    label: 'Diğer',
    color: '#ffffff',
    bgColor: '#6b7280',
    description: 'Diğer yargı bölgesi',
    icon: '📍',
  },
};

// Default location per resource type (CRM + admin tables)
const RESOURCE_DEFAULT_LOCATION: Record<string, ResidencyLocation> = {
  Lead: 'TR_LOCAL',
  Deal: 'TR_LOCAL',
  Invoice: 'TR_LOCAL',
  Document: 'TR_LOCAL',
  AuditLog: 'TR_LOCAL',
  Analytics: 'EU_GDPR',
  Session: 'TR_LOCAL',
  User: 'TR_LOCAL',
};

export function getDefaultLocation(resourceType: string): ResidencyLocation {
  return RESOURCE_DEFAULT_LOCATION[resourceType] ?? 'OTHER';
}

export function isTransferRequired(location: ResidencyLocation): boolean {
  return location === 'EU_GDPR' || location === 'US_SCC';
}
