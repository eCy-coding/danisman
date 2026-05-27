import { describe, test, expect } from 'vitest';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const SCHEMA_PATH = path.resolve(__dirname, '../../prisma/schema.prisma');
const schemaContent = fs.readFileSync(SCHEMA_PATH, 'utf-8');

describe('Revenue Schema Migration Smoke — M1 (Phase 2.5)', () => {
  test('prisma validate passes (idempotent first run)', () => {
    const result = execSync('npx prisma validate 2>&1', { encoding: 'utf-8' });
    expect(result).toMatch(/valid/i);
  });

  test('prisma validate passes (idempotent second run)', () => {
    const result = execSync('npx prisma validate 2>&1', { encoding: 'utf-8' });
    expect(result).toMatch(/valid/i);
  });

  test('Foreign key: Retainer has @relation to Deal with dealId @unique (enforces 1:1)', () => {
    expect(schemaContent).toMatch(/dealId\s+String\s+@unique/);
    expect(schemaContent).toContain('@relation(fields: [dealId], references: [id])');
  });

  test('Decimal precision: monetary fields use Decimal (NUMERIC(38,18) in Postgres)', () => {
    // All money fields must be Decimal for financial precision
    expect(schemaContent).toMatch(/monthlyAmount\s+Decimal/);
    expect(schemaContent).toMatch(/subtotal\s+Decimal/);
    expect(schemaContent).toMatch(/kdv\s+Decimal/);
    expect(schemaContent).toMatch(/total\s+Decimal/);
    expect(schemaContent).toMatch(/transactionValueUsd\s+Decimal\?/);
  });

  test('AuditLog.adminId exists for system cron entries', () => {
    // Monthly billing cron uses adminId: 'system:monthly-billing-cron'
    expect(schemaContent).toContain('adminId');
    expect(schemaContent).toContain('AuditLog');
  });

  test('OutreachProspect has PII fields contactName + contactEmail (KVKK surface)', () => {
    expect(schemaContent).toContain('contactName');
    expect(schemaContent).toContain('contactEmail');
    // Both nullable — prospect might not have email yet
    expect(schemaContent).toMatch(/contactName\s+String\?/);
    expect(schemaContent).toMatch(/contactEmail\s+String\?/);
  });

  test('All 7 DealStage enum values present', () => {
    const stages = [
      'DISCOVERY',
      'DD',
      'NEGOTIATION',
      'SPA_SIGNING',
      'CLOSING',
      'CLOSED_WON',
      'CLOSED_LOST',
    ];
    for (const s of stages) {
      expect(schemaContent).toContain(s);
    }
  });
});
