/**
 * BagimsizlikBeyaniGenerator — Bağımsızlık Beyanı görüntüleyici + indirici.
 *
 * KVKK ve iç denetim gereklilikleri: yıllık bağımsızlık teyidi belgesini
 * JSON formatında indirir.
 */

import React from 'react';
import { Shield, Download, AlertTriangle, CheckCircle, Calendar } from 'lucide-react';

export interface IndependenceCheckItem {
  id: string;
  clientId: string;
  checkedAt: string;
  auditFirmConflicts: string[];
  pureAdvisoryConfirmed: boolean;
  signatoryUserId: string;
  declarationDocUrl?: string | null;
  validUntil: string;
}

interface Props {
  check: IndependenceCheckItem;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export const BagimsizlikBeyaniGenerator: React.FC<Props> = ({ check }) => {
  const hasConflicts = check.auditFirmConflicts.length > 0;

  const handleDownload = () => {
    const beyan = {
      belge: 'Bağımsızlık Beyanı',
      checkId: check.id,
      clientId: check.clientId,
      checkedAt: check.checkedAt,
      auditFirmConflicts: check.auditFirmConflicts,
      pureAdvisoryConfirmed: check.pureAdvisoryConfirmed,
      signatoryUserId: check.signatoryUserId,
      declarationDocUrl: check.declarationDocUrl ?? null,
      validUntil: check.validUntil,
      generatedAt: new Date().toISOString(),
      issuer: 'eCyPro Premium Consulting',
    };

    const blob = new Blob([JSON.stringify(beyan, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bagimsizlik-beyani-${check.id.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className={`rounded-lg border p-fib-6 ${
        hasConflicts ? 'border-[#92400E] bg-[#1C0D03]' : 'border-[#065F46] bg-[#022C22]'
      }`}
    >
      {/* Başlık */}
      <div className="flex items-center gap-fib-4 mb-fib-6">
        <Shield className={`w-5 h-5 ${hasConflicts ? 'text-[#FCD34D]' : 'text-[#34D399]'}`} />
        <h2
          className={`text-golden-lg font-bold ${hasConflicts ? 'text-[#FCD34D]' : 'text-[#34D399]'}`}
        >
          Bağımsızlık Beyanı
        </h2>
        {hasConflicts ? (
          <span className="ml-auto inline-flex items-center gap-fib-2 text-xs bg-[#451A03] text-[#FCD34D] px-fib-4 py-fib-2 rounded border border-[#92400E]">
            <AlertTriangle className="w-3 h-3" />
            Çakışma Var
          </span>
        ) : (
          <span className="ml-auto inline-flex items-center gap-fib-2 text-xs bg-[#022C22] text-[#34D399] px-fib-4 py-fib-2 rounded border border-[#065F46]">
            <CheckCircle className="w-3 h-3" />
            Temiz
          </span>
        )}
      </div>

      {/* Detaylar */}
      <dl className="grid grid-cols-1 gap-fib-5 text-golden-sm">
        <div className="grid grid-cols-2 gap-fib-5">
          <div>
            <dt className="text-[#6EE7B7] font-medium mb-fib-2">Müşteri ID</dt>
            <dd className="font-mono text-[#E5E7EB] text-xs">{check.clientId}</dd>
          </div>
          <div>
            <dt className="text-[#6EE7B7] font-medium mb-fib-2">Kontrol Tarihi</dt>
            <dd className="text-[#E5E7EB]">{formatDate(check.checkedAt)}</dd>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-fib-5">
          <div>
            <dt className="text-[#6EE7B7] font-medium mb-fib-2 flex items-center gap-fib-2">
              <Calendar className="w-3 h-3" />
              Geçerlilik
            </dt>
            <dd className="text-[#E5E7EB]">{formatDate(check.validUntil)}</dd>
          </div>
          <div>
            <dt className="text-[#6EE7B7] font-medium mb-fib-2">İmzacı</dt>
            <dd className="font-mono text-[#E5E7EB] text-xs">{check.signatoryUserId}</dd>
          </div>
        </div>

        {/* Big4 çakışmaları */}
        <div>
          <dt className="text-[#6EE7B7] font-medium mb-fib-2">Denetim Firması Çakışmaları</dt>
          <dd>
            {hasConflicts ? (
              <div className="flex flex-wrap gap-fib-3">
                {check.auditFirmConflicts.map((firm) => (
                  <span
                    key={firm}
                    className="inline-flex items-center gap-fib-2 text-xs bg-[#451A03] text-[#FCD34D] px-fib-3 py-fib-2 rounded font-mono border border-[#78350F]"
                  >
                    <AlertTriangle className="w-3 h-3" />
                    {firm}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-xs text-[#34D399] flex items-center gap-fib-2">
                <CheckCircle className="w-3 h-3" />
                Çakışma yok
              </span>
            )}
          </dd>
        </div>

        {/* Pure advisory */}
        <div>
          <dt className="text-[#6EE7B7] font-medium mb-fib-2">Danışmanlık Onayı</dt>
          <dd>
            {check.pureAdvisoryConfirmed ? (
              <span className="text-xs text-[#34D399] flex items-center gap-fib-2">
                <CheckCircle className="w-3 h-3" />
                Onaylandı — yalnızca danışmanlık
              </span>
            ) : (
              <span className="text-xs text-[#FCA5A5] flex items-center gap-fib-2">
                <AlertTriangle className="w-3 h-3" />
                Onaylanmadı
              </span>
            )}
          </dd>
        </div>
      </dl>

      <button
        onClick={handleDownload}
        className={`mt-fib-6 inline-flex items-center gap-fib-3 px-fib-6 py-fib-4 rounded text-sm font-medium transition-all active:scale-95 ${
          hasConflicts
            ? 'bg-[#451A03] hover:bg-[#78350F] text-[#FCD34D]'
            : 'bg-[#065F46] hover:bg-[#047857] text-[#34D399]'
        }`}
      >
        <Download className="w-4 h-4" />
        Beyanı İndir (JSON)
      </button>
    </div>
  );
};
