import { AntigravityTerminal } from '@/components/features/AntigravityTerminal';
import { SeoManager } from '@/components/seo/SeoManager';

export const TerminalPage = () => {
  return (
    <div className="w-full h-screen p-4 bg-black flex flex-col">
      {/* P15 — Egg/E2E route: SERP indeksi yasak. */}
      <SeoManager title="Antigravity Terminal" noIndex />
      <h1 className="text-white text-xl mb-4 font-mono">Antigravity Terminal (E2E Verified)</h1>
      <div className="flex-1 border border-gray-700 rounded-lg overflow-hidden">
        <AntigravityTerminal />
      </div>
    </div>
  );
};
