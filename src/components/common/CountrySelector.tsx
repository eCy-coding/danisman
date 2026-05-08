/**
 * CountrySelector — footer'a yerleştirilen bayrak/ülke/currency dropdown'ı
 *
 * - `/api/geo/countries` endpoint'inden 50 ülke listesi (TanStack Query, 1h cache)
 * - Seçim → localStorage `userCountry` + i18n.changeLanguage(suggestedLang)
 * - Ülke currency mapping → currencyStore.setCurrency()
 * - Combobox ARIA pattern, klavye erişilebilir (↑/↓/Enter/Escape)
 * - Search input ile filtre (50 ülke içinde)
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, Search } from 'lucide-react';
import { apiClient } from '../../lib/api';
import { useTranslation } from '../../lib/i18n';
import { useCurrencyStore, type Currency } from '../../stores/currencyStore';

interface Country {
  code: string;
  tr: string;
  en: string;
  currency: string;
  flag: string;
}

interface ApiResponse {
  status: 'success' | 'error';
  data: { items: Country[]; total: number };
}

const STORAGE_KEY = 'ecypro_user_country';
const SUPPORTED_CURRENCIES: Currency[] = ['TRY', 'USD', 'EUR'];

function getStoredCountry(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function setStoredCountry(code: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, code);
  } catch {
    /* ignore */
  }
}

export const CountrySelector: React.FC = () => {
  const { i18n } = useTranslation();
  const lang = (i18n.language || 'en').startsWith('tr') ? 'tr' : 'en';
  const setCurrency = useCurrencyStore((s) => s.setCurrency);

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedCode, setSelectedCode] = useState<string | null>(getStoredCountry());

  const wrapperRef = useRef<HTMLDivElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data } = useQuery<ApiResponse>({
    queryKey: ['geo-countries'],
    queryFn: () => apiClient.get<ApiResponse>('/geo/countries').then((r) => r.data),
    staleTime: 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const countries = useMemo<Country[]>(() => data?.data.items ?? [], [data]);

  const filtered = useMemo(() => {
    if (!search) return countries;
    const term = search.toLowerCase();
    return countries.filter(
      (c) =>
        c.code.toLowerCase().includes(term) ||
        c.tr.toLowerCase().includes(term) ||
        c.en.toLowerCase().includes(term),
    );
  }, [countries, search]);

  const selectedCountry = countries.find((c) => c.code === selectedCode);

  // Outside click → kapat
  useEffect(() => {
    const handler = (e: MouseEvent): void => {
      if (!wrapperRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Açıldığında input'a focus
  useEffect(() => {
    if (open) {
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  // Active option scroll into view
  useEffect(() => {
    if (!open) return;
    const list = listboxRef.current;
    if (!list) return;
    const active = list.querySelector<HTMLLIElement>(`[data-idx="${activeIndex}"]`);
    if (active) active.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, open]);

  const handleSelect = (country: Country): void => {
    setSelectedCode(country.code);
    setStoredCountry(country.code);

    // Currency switch (sadece desteklenenlerse)
    if ((SUPPORTED_CURRENCIES as string[]).includes(country.currency)) {
      setCurrency(country.currency as Currency);
    }

    // Lang öneri: TR → tr, diğer → en
    const suggested = country.code === 'TR' ? 'tr' : 'en';
    if (i18n.language !== suggested) {
      void i18n.changeLanguage(suggested);
    }

    setOpen(false);
    setSearch('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = filtered[activeIndex];
      if (target) handleSelect(target);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
      setSearch('');
    }
  };

  const buttonLabel = selectedCountry
    ? `${selectedCountry.flag} ${selectedCountry[lang]}`
    : lang === 'tr'
      ? '🌍 Ülke seçin'
      : '🌍 Select country';

  return (
    <div ref={wrapperRef} className="relative inline-block" data-testid="country-selector">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={lang === 'tr' ? 'Ülke seçin' : 'Select country'}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white transition-colors text-xs font-medium min-w-36"
      >
        <span className="truncate">{buttonLabel}</span>
        <ChevronDown
          size={12}
          className={`ml-auto shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={lang === 'tr' ? 'Ülkeler' : 'Countries'}
          className="absolute right-0 sm:left-0 bottom-full mb-2 w-72 bg-[#0f172a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
        >
          <div className="p-2 border-b border-white/5">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500"
                aria-hidden="true"
              />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={handleKeyDown}
                aria-label={lang === 'tr' ? 'Ülke ara' : 'Search country'}
                aria-controls="country-listbox"
                aria-activedescendant={`country-opt-${activeIndex}`}
                placeholder={lang === 'tr' ? 'Ülke ara…' : 'Search country…'}
                className="w-full bg-white/5 border border-white/10 rounded-md pl-8 pr-2 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-secondary"
              />
            </div>
          </div>
          <ul
            ref={listboxRef}
            id="country-listbox"
            role="listbox"
            className="max-h-64 overflow-y-auto py-1"
          >
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-xs text-slate-500 italic">
                {lang === 'tr' ? 'Sonuç yok' : 'No results'}
              </li>
            ) : (
              filtered.map((c, idx) => {
                const isActive = idx === activeIndex;
                const isSelected = c.code === selectedCode;
                return (
                  <li
                    key={c.code}
                    id={`country-opt-${idx}`}
                    role="option"
                    aria-selected={isSelected}
                    data-idx={idx}
                    tabIndex={-1}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => handleSelect(c)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSelect(c);
                      }
                    }}
                    className={`flex items-center gap-2.5 px-3 py-1.5 cursor-pointer text-xs transition-colors ${
                      isActive
                        ? 'bg-secondary/20 text-white'
                        : isSelected
                          ? 'bg-secondary/10 text-secondary'
                          : 'text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    <span className="text-base shrink-0" aria-hidden="true">
                      {c.flag}
                    </span>
                    <span className="flex-1 truncate">{c[lang]}</span>
                    <span className="font-mono text-[10px] text-slate-500">{c.currency}</span>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
