/**
 * P57.1 — Accordion primitive (collapsible sections).
 *
 * Native <details> wrapper + branded styling.
 */

import React from 'react';
import { ChevronDown } from 'lucide-react';

export interface AccordionItem {
  id: string;
  title: string;
  content: React.ReactNode;
  defaultOpen?: boolean;
}

export const Accordion: React.FC<{ items: AccordionItem[] }> = ({ items }) => {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <details
          key={item.id}
          open={item.defaultOpen}
          className="group bg-white/[0.02] border border-white/10 rounded-xl overflow-hidden"
        >
          <summary className="cursor-pointer list-none px-4 py-3 flex items-center justify-between gap-3 hover:bg-white/[0.03] transition-colors">
            <span className="text-sm font-semibold text-white">{item.title}</span>
            <ChevronDown
              size={16}
              className="text-slate-400 group-open:rotate-180 transition-transform"
              aria-hidden="true"
            />
          </summary>
          <div className="px-4 py-3 border-t border-white/5 text-sm text-slate-300">
            {item.content}
          </div>
        </details>
      ))}
    </div>
  );
};

export default Accordion;
