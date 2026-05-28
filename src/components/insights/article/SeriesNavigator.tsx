import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { InsightSeries } from '@/types/insights';

interface SeriesNavigatorProps {
  series: InsightSeries;
  currentOrder: number;
  totalParts: number;
  prevSlug?: string;
  nextSlug?: string;
  className?: string;
}

export function SeriesNavigator({
  series,
  currentOrder,
  totalParts,
  prevSlug,
  nextSlug,
  className,
}: SeriesNavigatorProps) {
  const [showModal, setShowModal] = useState(false);
  const progressPct = Math.round((currentOrder / totalParts) * 100);

  return (
    <>
      <section
        className={cn('rounded-xl border border-blue-200 bg-blue-50 p-fib-6', className)}
        aria-label="Seri navigasyonu"
        data-testid="series-navigator"
      >
        <div className="flex flex-wrap items-start justify-between gap-fib-4 mb-fib-5">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-500 mb-1 block">
              Seri Yazı
            </span>
            <h3 className="font-bold text-slate-800 text-base" data-testid="series-title">
              {series.titleTr}
            </h3>
          </div>
          <span
            className="rounded-full bg-blue-100 px-fib-4 py-1 text-sm font-bold text-blue-700"
            data-testid="series-part-indicator"
          >
            {currentOrder} / {totalParts}
          </span>
        </div>

        <div className="mb-fib-5" data-testid="series-progress-bar">
          <div className="h-2 rounded-full bg-blue-200">
            <div
              className="h-full rounded-full bg-blue-500 transition-[width] duration-300"
              style={{ width: `${progressPct}%` }}
              role="progressbar"
              aria-valuenow={currentOrder}
              aria-valuemin={1}
              aria-valuemax={totalParts}
              aria-label={`Seri ilerlemesi: ${currentOrder} / ${totalParts}`}
            />
          </div>
          <p className="text-xs text-blue-600 mt-1">{progressPct}% tamamlandı</p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-fib-4">
          <div className="flex gap-fib-3">
            {prevSlug ? (
              <Link
                to={`/insights/${prevSlug}`}
                className="inline-flex items-center gap-fib-2 rounded-lg border border-blue-300 bg-white px-fib-4 py-fib-3 text-sm font-medium text-blue-700 hover:bg-blue-50 transition-colors"
                data-testid="series-prev-button"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m15 18-6-6 6-6" />
                </svg>
                Önceki
              </Link>
            ) : (
              <span
                className="inline-flex items-center gap-fib-2 rounded-lg border border-slate-200 bg-slate-100 px-fib-4 py-fib-3 text-sm font-medium text-slate-400 cursor-not-allowed"
                aria-disabled="true"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="m15 18-6-6 6-6" />
                </svg>
                Önceki
              </span>
            )}

            {nextSlug ? (
              <Link
                to={`/insights/${nextSlug}`}
                className="inline-flex items-center gap-fib-2 rounded-lg bg-blue-600 px-fib-4 py-fib-3 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                data-testid="series-next-button"
              >
                Sonraki
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </Link>
            ) : (
              <span className="inline-flex items-center gap-fib-2 rounded-lg bg-slate-100 border border-slate-200 px-fib-4 py-fib-3 text-sm font-medium text-slate-400 cursor-not-allowed">
                Sonraki
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </span>
            )}
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors underline underline-offset-2"
            data-testid="series-content-button"
          >
            Seri içeriği →
          </button>
        </div>
      </section>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-label="Seri içeriği"
          data-testid="series-modal"
        >
          <button
            type="button"
            className="absolute inset-0 w-full h-full cursor-default"
            aria-label="Modalı kapat"
            onClick={() => setShowModal(false)}
          />
          <div className="relative max-w-md w-full mx-4 rounded-2xl bg-white p-fib-7 shadow-2xl">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
              aria-label="Kapat"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
            <h3 className="font-bold text-slate-900 text-lg mb-2">{series.titleTr}</h3>
            <p className="text-sm text-slate-600 mb-fib-5">{series.descriptionTr}</p>
            <p className="text-sm text-slate-500">
              {totalParts} bölüm · Bölüm {currentOrder} / {totalParts}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
