/**
 * M2 — useTheme hook
 * Reads from ThemeContext.
 */
import { useContext } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';

export function useTheme() {
  return useContext(ThemeContext);
}
