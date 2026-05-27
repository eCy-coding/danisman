/**
 * RetentionPolicyTable — KVKK m.7 saklama süresi tablosu.
 *
 * Her kaynak tipi için saklama süresi, hukuki dayanak, son imha tarihi ve
 * "İmha Uygula" butonu gösterir.
 */

import React from 'react';
import { Trash2, Clock, Shield } from 'lucide-react';

export interface RetentionPolicyItem {
  id: string;
  resourceType: string;
  retentionDays: number;
  legalBasis: string;
  lastEnforced?: string | null;
}

interface Props {
  policies: RetentionPolicyItem[];
  onEnforce: (resourceType: string) => void;
}

function retentionLabel(days: number): string {
  if (days >= 3650) return `${Math.round(days / 365)} yıl`;
  if (days >= 365) {
    const years = Math.floor(days / 365);
    const remainder = days % 365;
    return remainder > 0 ? `${years} yıl ${remainder} gün` : `${years} yıl`;
  }
  if (days >= 30) return `${Math.round(days / 30)} ay`;
  return `${days} gün`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export const RetentionPolicyTable: React.FC<Props> = ({ policies, onEnforce }) => {
  if (policies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-fib-8 text-[#6B7280]">
        <Shield className="w-8 h-8 mb-fib-5 opacity-40" />
        <p className="text-golden-base">Henüz kayıt yok. "Politikaları Yükle" ile başlayın.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-[#2A2B2C]">
      <table className="w-full text-golden-sm">
        <thead>
          <tr className="border-b border-[#2A2B2C] bg-[#1A1B1C]">
            <th className="text-left p-fib-5 text-[#9CA3AF] font-medium">Kaynak Tipi</th>
            <th className="text-left p-fib-5 text-[#9CA3AF] font-medium">Saklama Süresi</th>
            <th className="text-left p-fib-5 text-[#9CA3AF] font-medium">Hukuki Dayanak</th>
            <th className="text-left p-fib-5 text-[#9CA3AF] font-medium">Son İmha</th>
            <th className="text-right p-fib-5 text-[#9CA3AF] font-medium">İşlem</th>
          </tr>
        </thead>
        <tbody>
          {policies.map((policy) => (
            <tr
              key={policy.id}
              className="border-b border-[#2A2B2C] bg-[#1E1F20] hover:bg-[#232425] transition-colors"
            >
              <td className="p-fib-5 font-mono text-[#E5E7EB]">{policy.resourceType}</td>
              <td className="p-fib-5">
                <span className="inline-flex items-center gap-fib-3 text-[#60A5FA]">
                  <Clock className="w-3 h-3" />
                  {retentionLabel(policy.retentionDays)}
                  <span className="text-[#6B7280] text-xs">({policy.retentionDays}g)</span>
                </span>
              </td>
              <td className="p-fib-5 text-[#D1D5DB] max-w-xs truncate" title={policy.legalBasis}>
                {policy.legalBasis}
              </td>
              <td className="p-fib-5 text-[#9CA3AF]">
                {policy.lastEnforced ? formatDate(policy.lastEnforced) : '—'}
              </td>
              <td className="p-fib-5 text-right">
                <button
                  onClick={() => onEnforce(policy.resourceType)}
                  className="inline-flex items-center gap-fib-3 px-fib-5 py-fib-3 rounded bg-[#7F1D1D] hover:bg-[#991B1B] active:scale-95 text-[#FCA5A5] text-xs font-medium transition-all"
                  title={`${policy.resourceType} için imha uygula`}
                >
                  <Trash2 className="w-3 h-3" />
                  İmha Uygula
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
