/**
 * e2e/mock-url.ts
 * Tek kaynak — mock-server host/port. playwright.config.ts webServer
 * girdisiyle birebir eşleşir; port kayması E2E_MOCK_PORT ile taşınır.
 * Varsayılan 3099 SABİT kalır (CI + diğer makineler etkilenmez) — bu
 * dosya sadece lokal port çakışması olduğunda override edilir.
 */

export const MOCK_PORT = process.env.E2E_MOCK_PORT ?? '3099';
export const MOCK_HOST = `localhost:${MOCK_PORT}`;
export const MOCK_URL = process.env.E2E_MOCK_URL ?? `http://${MOCK_HOST}`;
