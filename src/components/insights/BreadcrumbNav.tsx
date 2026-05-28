import React from 'react';
import { Link } from 'react-router-dom';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbNavProps {
  items: BreadcrumbItem[];
}

export function BreadcrumbNav({ items }: BreadcrumbNavProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-[8px] text-sm text-slate-500">
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <span aria-hidden="true" className="text-slate-700">
              ›
            </span>
          )}
          {item.href ? (
            <Link
              to={item.href}
              className="hover:text-amber-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded"
            >
              {item.label}
            </Link>
          ) : (
            <span aria-current="page" className="text-slate-300">
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
