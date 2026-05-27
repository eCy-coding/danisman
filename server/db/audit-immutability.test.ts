import { describe, it, expect, vi } from 'vitest';

// Mock the db module to return a prisma with $extends support
const mockExtendedPrisma = {
  dSARAuditEntry: {
    update: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    updateMany: vi.fn(),
  },
};

vi.mock('../config/db', () => ({
  prisma: {
    $extends: vi.fn((ext: unknown) => {
      // Simulate the extension by wrapping operations
      const extObj = ext as Record<
        string,
        Record<string, Record<string, (...args: unknown[]) => unknown>>
      >;
      const queries = extObj.query?.dSARAuditEntry ?? {};
      return {
        dSARAuditEntry: {
          update: (args: unknown) =>
            queries.update
              ? queries.update({ args, query: mockExtendedPrisma.dSARAuditEntry.update })
              : mockExtendedPrisma.dSARAuditEntry.update(args),
          delete: (args: unknown) =>
            queries.delete
              ? queries.delete({ args, query: mockExtendedPrisma.dSARAuditEntry.delete })
              : mockExtendedPrisma.dSARAuditEntry.delete(args),
          deleteMany: (args: unknown) =>
            queries.deleteMany
              ? queries.deleteMany({ args, query: mockExtendedPrisma.dSARAuditEntry.deleteMany })
              : mockExtendedPrisma.dSARAuditEntry.deleteMany(args),
          updateMany: (args: unknown) =>
            queries.updateMany
              ? queries.updateMany({ args, query: mockExtendedPrisma.dSARAuditEntry.updateMany })
              : mockExtendedPrisma.dSARAuditEntry.updateMany(args),
        },
      };
    }),
  },
}));

import { auditImmutabilityGuard } from './audit-immutability';

describe('Audit Log Immutability Guard (KVKK m.12)', () => {
  it('update DSARAuditEntry → throws forbidden error', async () => {
    await expect(
      auditImmutabilityGuard.dSARAuditEntry.update({
        where: { id: '1' },
        data: { action: 'hacked' },
      }),
    ).rejects.toThrow('immutable');
  });

  it('delete DSARAuditEntry → throws forbidden error', async () => {
    await expect(
      auditImmutabilityGuard.dSARAuditEntry.delete({ where: { id: '1' } }),
    ).rejects.toThrow('immutable');
  });

  it('deleteMany DSARAuditEntry → throws forbidden error', async () => {
    await expect(auditImmutabilityGuard.dSARAuditEntry.deleteMany({ where: {} })).rejects.toThrow(
      'immutable',
    );
  });

  it('updateMany DSARAuditEntry → throws forbidden error', async () => {
    await expect(
      auditImmutabilityGuard.dSARAuditEntry.updateMany({ where: {}, data: {} }),
    ).rejects.toThrow('immutable');
  });
});
