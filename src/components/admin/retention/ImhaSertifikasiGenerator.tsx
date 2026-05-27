/**
 * ImhaSertifikasiGenerator — Veri İmha Sertifikası görüntüleyici + indirici.
 *
 * KVKK m.7: imha işlemi sonrası sertifika belgesi üretir ve JSON olarak indirir.
 */

import React from 'react';
import { FileCheck, Download, Shield } from 'lucide-react';

interface Props {
  resourceType: string;
  enforcedAt: string;
  sertifikaId: string;
  legalBasis?: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const ImhaSertifikasiGenerator: React.FC<Props> = ({
  resourceType,
  enforcedAt,
  sertifikaId,
  legalBasis,
}) => {
  const handleDownload = () => {
    const sertifika = {
      belge: 'Veri İmha Sertifikası',
      sertifikaId,
      resourceType,
      enforcedAt,
      legalBasis: legalBasis ?? null,
      generatedAt: new Date().toISOString(),
      issuer: 'eCyPro Premium Consulting',
    };

    const blob = new Blob([JSON.stringify(sertifika, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `imha-sertifikasi-${sertifikaId.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-lg border border-[#065F46] bg-[#022C22] p-fib-6">
      <div className="flex items-center gap-fib-4 mb-fib-5">
        <Shield className="w-5 h-5 text-[#34D399]" />
        <h3 className="text-golden-base font-semibold text-[#34D399]">Veri İmha Sertifikası</h3>
      </div>

      <dl className="grid grid-cols-1 gap-fib-4 text-golden-sm">
        <div className="flex flex-col gap-fib-2">
          <dt className="text-[#6EE7B7] font-medium">Sertifika ID</dt>
          <dd className="font-mono text-[#E5E7EB] text-xs bg-[#064E3B] rounded px-fib-4 py-fib-2 break-all">
            {sertifikaId}
          </dd>
        </div>

        <div className="flex gap-fib-7">
          <div className="flex flex-col gap-fib-2 flex-1">
            <dt className="text-[#6EE7B7] font-medium">Kaynak Tipi</dt>
            <dd className="font-mono text-[#E5E7EB]">{resourceType}</dd>
          </div>
          <div className="flex flex-col gap-fib-2 flex-1">
            <dt className="text-[#6EE7B7] font-medium">İmha Tarihi</dt>
            <dd className="text-[#E5E7EB]">{formatDate(enforcedAt)}</dd>
          </div>
        </div>

        {legalBasis && (
          <div className="flex flex-col gap-fib-2">
            <dt className="text-[#6EE7B7] font-medium">Hukuki Dayanak</dt>
            <dd className="text-[#D1D5DB]">{legalBasis}</dd>
          </div>
        )}
      </dl>

      <div className="mt-fib-5 flex items-center gap-fib-4">
        <FileCheck className="w-4 h-4 text-[#34D399]" />
        <span className="text-xs text-[#6EE7B7]">KVKK m.7 — İmha kaydı oluşturuldu</span>
      </div>

      <button
        onClick={handleDownload}
        className="mt-fib-5 inline-flex items-center gap-fib-3 px-fib-6 py-fib-4 rounded bg-[#065F46] hover:bg-[#047857] active:scale-95 text-[#34D399] text-sm font-medium transition-all"
      >
        <Download className="w-4 h-4" />
        Sertifikayı İndir (JSON)
      </button>
    </div>
  );
};
