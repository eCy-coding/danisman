import React from 'react';
import { ShieldCheck, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

interface KVKKBadgeProps {
  className?: string;
}

export const KVKKBadge: React.FC<KVKKBadgeProps> = ({ className = '' }) => {
  return (
    <div
      data-testid="kvkk-badge"
      className={`flex flex-wrap items-center gap-3 text-xs text-slate-400 ${className}`}
      aria-label="KVKK uyumluluk bilgisi"
    >
      <span className="inline-flex items-center gap-1.5">
        <ShieldCheck size={13} className="text-green-500 shrink-0" aria-hidden="true" />
        ROPA SAT-01
      </span>
      <span aria-hidden="true" className="text-slate-600">
        ·
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Lock size={13} className="text-green-500 shrink-0" aria-hidden="true" />3 yıl saklama
      </span>
      <span aria-hidden="true" className="text-slate-600">
        ·
      </span>
      <span>DSAR hakkı</span>
      <span aria-hidden="true" className="text-slate-600">
        ·
      </span>
      <Link
        to="/privacy"
        className="underline hover:text-slate-300 transition-colors"
        aria-label="VERBİS kayıt bilgisi ve KVKK politikası"
      >
        VERBİS kayıtlı
      </Link>
    </div>
  );
};

export default KVKKBadge;
