/**
 * VERBISExportButton — exports ROPA summary as a JSON download for VERBİS notification.
 *
 * Calls GET /api/admin/ropa to fetch all processes, then triggers a JSON file download.
 */

import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { apiClient } from '../../../lib/api';

export interface VERBISExportButtonProps {
  disabled?: boolean;
}

interface ROPAProcess {
  processId: string;
  name: string;
  purpose: string;
  legalBasis: string;
  dataCategories: string[];
  retentionPeriod: string;
  transferLocation: string;
  status: string;
}

interface ROPAListResponse {
  status: string;
  data: ROPAProcess[];
}

export const VERBISExportButton: React.FC<VERBISExportButtonProps> = ({ disabled = false }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setError(null);

    try {
      const response = await apiClient.get<ROPAListResponse>('/admin/ropa');
      const processes = response.data?.data ?? [];

      const exportPayload = {
        exportedAt: new Date().toISOString(),
        exportedBy: 'eCyPro Admin Panel',
        purpose: 'VERBİS Veri Sorumlusu Bildirimi — ROPA Özeti',
        totalProcesses: processes.length,
        processes: processes.map((p) => ({
          processId: p.processId,
          name: p.name,
          purpose: p.purpose,
          legalBasis: p.legalBasis,
          dataCategories: p.dataCategories,
          retentionPeriod: p.retentionPeriod,
          transferLocation: p.transferLocation,
          status: p.status,
        })),
      };

      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `verbis-ropa-ozet-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    } catch {
      setError('Dışa aktarma başarısız. Lütfen tekrar deneyin.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-fib-2">
      <button
        type="button"
        onClick={() => void handleExport()}
        disabled={disabled || isExporting}
        className={cn(
          'inline-flex items-center gap-fib-3 rounded border px-fib-5 py-fib-3 text-sm font-medium transition-colors',
          disabled || isExporting
            ? 'cursor-not-allowed border-gray-600/40 bg-gray-800/40 text-gray-500'
            : 'border-blue-600/50 bg-blue-900/20 text-blue-200 hover:bg-blue-800/30',
        )}
      >
        <Download className="h-4 w-4" aria-hidden="true" />
        {isExporting ? 'Dışa aktarılıyor…' : 'ROPA Özet Dışa Aktar (VERBİS)'}
      </button>

      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
};
