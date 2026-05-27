import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

export type UrlStateValue = string | string[] | null;

/**
 * M7 — useUrlState: persists filter state in URL search params.
 * Bookmark + share ready. Works with React Router v7.
 */
export function useUrlState(key: string): [UrlStateValue, (value: UrlStateValue) => void] {
  const [searchParams, setSearchParams] = useSearchParams();

  const value = searchParams.getAll(key);
  const resolved: UrlStateValue =
    value.length === 0 ? null : value.length === 1 ? (value[0] ?? null) : value;

  const setValue = useCallback(
    (next: UrlStateValue) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          params.delete(key);
          if (next !== null) {
            const arr = Array.isArray(next) ? next : [next];
            arr.filter(Boolean).forEach((v) => params.append(key, v));
          }
          return params;
        },
        { replace: true },
      );
    },
    [key, setSearchParams],
  );

  return [resolved, setValue];
}
