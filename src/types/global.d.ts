import { Director } from '@/lib/director';

declare global {
  interface Window {
    __DIRECTOR__: Director;
  }
}

export {};
