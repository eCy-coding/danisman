import { prisma as basePrisma } from '../config/db';

// Prisma $extends throws on any update/delete of dSARAuditEntry
export const auditImmutabilityGuard = basePrisma.$extends({
  query: {
    dSARAuditEntry: {
      async update(_: { args: unknown; query: (args: unknown) => Promise<unknown> }) {
        throw new Error('DSARAuditEntry is immutable — updates forbidden (KVKK m.12)');
      },
      async delete(_: { args: unknown; query: (args: unknown) => Promise<unknown> }) {
        throw new Error('DSARAuditEntry is immutable — deletes forbidden (KVKK m.12)');
      },
      async deleteMany(_: { args: unknown; query: (args: unknown) => Promise<unknown> }) {
        throw new Error('DSARAuditEntry is immutable — bulk deletes forbidden (KVKK m.12)');
      },
      async updateMany(_: { args: unknown; query: (args: unknown) => Promise<unknown> }) {
        throw new Error('DSARAuditEntry is immutable — bulk updates forbidden (KVKK m.12)');
      },
    },
  },
});
