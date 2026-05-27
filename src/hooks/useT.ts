import { useTranslation } from 'react-i18next';

/** Alias: useTranslation('admin') for admin panel components. */
export function useT() {
  return useTranslation('admin');
}
