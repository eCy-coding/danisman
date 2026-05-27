import { describe, it, expect } from 'vitest';
import { ROPA_TEMPLATES } from './ropa-template';
import type { ROPATemplate } from './ropa-template';

describe('ROPA_TEMPLATES — code-locked retention (01_NOTEBOOKLM_FINDINGS §2.7)', () => {
  it('has exactly 8 processes', () => {
    expect(ROPA_TEMPLATES).toHaveLength(8);
  });

  it('processIds = [HR-01, HR-02, SAT-01, PAZ-01, WEB-01, TED-01, GUV-01, ICT-01]', () => {
    const ids = ROPA_TEMPLATES.map((t) => t.processId);
    expect(ids).toEqual([
      'HR-01',
      'HR-02',
      'SAT-01',
      'PAZ-01',
      'WEB-01',
      'TED-01',
      'GUV-01',
      'ICT-01',
    ]);
  });

  it('HR-01 (Bordro) retentionPeriodDays = 3650 (10 yıl)', () => {
    const hr01 = ROPA_TEMPLATES.find((t) => t.processId === 'HR-01')!;
    expect(hr01.retentionPeriodDays).toBe(3650);
    expect(hr01.retentionPeriod).toBe('10 yıl');
  });

  it('GUV-01 (Kamera) retentionPeriodDays = 30 (§2.7 birebir)', () => {
    const g = ROPA_TEMPLATES.find((t) => t.processId === 'GUV-01')!;
    expect(g.retentionPeriodDays).toBe(30);
  });

  it('ICT-01 (Web log 5651) retentionPeriodDays = 730 (2 yıl)', () => {
    const ict = ROPA_TEMPLATES.find((t) => t.processId === 'ICT-01')!;
    expect(ict.retentionPeriodDays).toBe(730);
  });

  it('Cannot push to frozen ROPA_TEMPLATES at runtime', () => {
    expect(() => {
      (ROPA_TEMPLATES as unknown as ROPATemplate[]).push({} as ROPATemplate);
    }).toThrow();
  });

  it('SAT-01 (CRM) transferMechanism is KVKK m.9 reference', () => {
    const sat = ROPA_TEMPLATES.find((t) => t.processId === 'SAT-01')!;
    expect(sat.transferMechanism).toContain('SCC');
  });
});
