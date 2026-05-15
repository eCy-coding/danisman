/**
 * LegalDisclaimer — DRAFT banner for legal pages.
 * Shown prominently at top of every legal page.
 * Must remain until lawyer review + approval.
 */

import React from 'react';
import { AlertTriangle } from 'lucide-react';

export const LegalDisclaimer: React.FC = () => {
  return (
    <div
      role="alert"
      aria-live="polite"
      className="border-l-4 border-amber-500 bg-amber-950/30 p-4 mb-8 rounded-r-lg"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle
          size={20}
          className="text-amber-400 shrink-0 mt-0.5"
          aria-hidden="true"
        />
        <div>
          <p className="font-bold text-amber-300 text-sm uppercase tracking-wide mb-1">
            ⚠ TASLAK — AVUKAT ONAYINDAN GEÇMEMİŞTİR / DRAFT — NOT REVIEWED BY LEGAL COUNSEL
          </p>
          <p className="text-amber-200/80 text-xs leading-relaxed">
            Bu belge taslak niteliğinde olup hukuki geçerlilik kazanabilmesi için uzman bir avukat tarafından
            incelenmesi ve onaylanması zorunludur. Yayınlamadan önce hukuki danışmanlık alınız.
            <br />
            <span className="italic">
              This document is a draft and must be reviewed and approved by qualified legal counsel before
              publication. Do not publish without legal review.
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};
