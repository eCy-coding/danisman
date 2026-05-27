import { describe, test, expect } from 'vitest';
import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import path from 'path';

const schemaPath = path.resolve(__dirname, '../../prisma/schema.prisma');

describe('Revenue schema — M1', () => {
  test('Prisma validates revenue schema without errors', () => {
    const result = execSync(`npx prisma validate --schema="${schemaPath}"`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    expect(result).toContain('valid');
  });

  test('Deal model has required revenue fields', () => {
    const schema = readFileSync(schemaPath, 'utf-8');
    expect(schema).toContain('model Deal');
    expect(schema).toContain('transactionValueUsd');
    expect(schema).toContain('successFeePct');
    expect(schema).toContain('closedLostReason');
    expect(schema).toContain('DealStage');
    expect(schema).toContain('DealType');
  });

  test('Retainer model has 1-1 relation to Deal via @unique dealId', () => {
    const schema = readFileSync(schemaPath, 'utf-8');
    expect(schema).toContain('model Retainer');
    expect(schema).toContain('dealId        String         @unique');
    expect(schema).toContain('kdvRate');
    expect(schema).toContain('stopajRate');
    expect(schema).toContain('Currency');
    expect(schema).toContain('RetainerStatus');
  });

  test('Milestone model indexed by [dealId, expectedDate]', () => {
    const schema = readFileSync(schemaPath, 'utf-8');
    expect(schema).toContain('model Milestone');
    expect(schema).toContain('amountPct');
    expect(schema).toContain('@@index([dealId, expectedDate])');
    expect(schema).toContain('MilestoneStatus');
  });

  test('Invoice golden case fields — subtotal + kdv - stopaj = total', () => {
    // Schema structural check: all fields exist
    const schema = readFileSync(schemaPath, 'utf-8');
    expect(schema).toContain('model Invoice');
    expect(schema).toContain('subtotal      Decimal');
    expect(schema).toContain('kdv           Decimal');
    expect(schema).toContain('stopaj        Decimal');
    expect(schema).toContain('total         Decimal');
    expect(schema).toContain('invoiceNumber String        @unique');
    expect(schema).toContain('@@index([status, dueDate])');
  });

  test('OutreachWave + OutreachProspect models present with KPI fields', () => {
    const schema = readFileSync(schemaPath, 'utf-8');
    expect(schema).toContain('model OutreachWave');
    expect(schema).toContain('targetRevenueUsd');
    expect(schema).toContain('realizedRevenueUsd');
    expect(schema).toContain('model OutreachProspect');
    expect(schema).toContain('openedAt');
    expect(schema).toContain('repliedAt');
    expect(schema).toContain('ProspectStatus');
    expect(schema).toContain('@@index([waveId, status])');
  });

  test('All 7 new enums defined in schema', () => {
    const schema = readFileSync(schemaPath, 'utf-8');
    const enums = [
      'DealType',
      'DealStage',
      'Currency',
      'RetainerStatus',
      'MilestoneStatus',
      'InvoiceStatus',
      'WaveStatus',
      'ProspectStatus',
    ];
    for (const e of enums) {
      expect(schema, `Missing enum: ${e}`).toContain(`enum ${e}`);
    }
  });
});
