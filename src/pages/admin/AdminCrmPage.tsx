/**
 * AdminCrmPage — CRM ana sayfası
 *
 * 3 sütun layout:
 *  - Sol geniş: HotLeadsTable (filtreli)
 *  - Sağ dar: PipelineFunnelChart + LiveLeadFeed
 * Helmet meta, breadcrumb, yenile butonu
 */

import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useQueryClient } from '@tanstack/react-query';
import { RefreshCw, TrendingUp } from 'lucide-react';
import { HotLeadsTable } from '../../components/admin/HotLeadsTable';
import { PipelineFunnelChart } from '../../components/admin/PipelineFunnelChart';
import { LiveLeadFeed } from '../../components/admin/LiveLeadFeed';

export const AdminCrmPage: React.FC = () => {
  const queryClient = useQueryClient();

  const handleRefresh = (): void => {
    void queryClient.invalidateQueries({ queryKey: ['crm-hot-leads'] });
    void queryClient.invalidateQueries({ queryKey: ['crm-pipeline-stats'] });
  };

  return (
    <>
      <Helmet>
        <title>CRM — eCyPro Admin</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <div className="p-6 max-w-350 mx-auto">
        {/* Page Header */}
        <header className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5 text-secondary" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl font-serif text-white tracking-tight">CRM</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Lead pipeline · Hot leads · Funnel analizi
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            aria-label="Verileri yenile"
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 text-slate-300 hover:bg-white/5 hover:text-white transition-colors text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            <span>Yenile</span>
          </button>
        </header>

        {/* Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
          {/* Left — Hot Leads Table */}
          <section aria-labelledby="hot-leads-heading">
            <h2
              id="hot-leads-heading"
              className="text-xs font-mono uppercase tracking-widest text-slate-500 mb-3"
            >
              Sıcak Leadler (Tier A)
            </h2>
            <HotLeadsTable />
          </section>

          {/* Right — Pipeline + Live Feed */}
          <aside className="space-y-6">
            <section aria-labelledby="pipeline-heading">
              <h2
                id="pipeline-heading"
                className="text-xs font-mono uppercase tracking-widest text-slate-500 mb-3"
              >
                Pipeline Funnel
              </h2>
              <PipelineFunnelChart />
            </section>

            <section aria-labelledby="live-feed-heading">
              <h2
                id="live-feed-heading"
                className="text-xs font-mono uppercase tracking-widest text-slate-500 mb-3"
              >
                Canlı Akış
              </h2>
              <LiveLeadFeed />
            </section>
          </aside>
        </div>
      </div>
    </>
  );
};
