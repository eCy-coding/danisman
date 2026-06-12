import { Router } from 'express';
import type { Response } from 'express';
import { Prisma, ResearchJobStatus, UserRole } from '@prisma/client';
import { prisma } from '../config/db';
import { logger } from '../config/logger';
import { authenticate } from '../middleware/auth';
import type { AuthRequest } from '../middleware/auth';
import { apiKeyAuth } from '../middleware/api-key-auth';
import {
  BridgePatchSchema,
  CreateResearchJobSchema,
  DraftPayloadSchema,
  JobListQuerySchema,
  type DraftPayload,
} from '../schemas/research';

// ─── Research Bridge (P82) — NotebookLM → admin draft pipeline ───────────────
// Two auth planes on one router:
//   • /jobs*        → admin JWT (ADMIN | EDITOR queue + read; cancel ADMIN-only
//                     mirrors insights RBAC: editors create, admins kill).
//   • /bridge/*     → ApiKey with scope "research:bridge" — the local worker on
//                     the owner's machine. JWT'siz: the bridge is headless.
// NO router-level `authenticate` — the bridge plane must stay JWT-free.

export const adminResearchRouter = Router();

const WRITE_ROLES: UserRole[] = [UserRole.ADMIN, UserRole.EDITOR];
const BRIDGE_SCOPE = 'research:bridge';

// A job counts as "bridge alive" evidence when the bridge touched it recently.
const BRIDGE_ALIVE_WINDOW_MS = 120_000;

// Idle-queue heartbeat: claim polls return 204 without touching any job row,
// so job updatedAt alone flips the UI badge to "offline" after 2 idle
// minutes even while the bridge polls every 15s. Stored on app.locals (not a
// module var) so each test app starts cold; in-memory is enough — the bridge
// repopulates it within one poll interval after a server restart.
const HEARTBEAT_KEY = 'researchBridgeLastClaimAtMs';

function readHeartbeatMs(app: { locals: Record<string, unknown> }): number {
  const v = app.locals[HEARTBEAT_KEY];
  return typeof v === 'number' ? v : 0;
}

// Statuses a bridge PATCH may target while the job is still in flight.
const ACTIVE_STATUSES: ResearchJobStatus[] = [
  ResearchJobStatus.CLAIMED,
  ResearchJobStatus.RESEARCHING,
  ResearchJobStatus.IMPORTING,
  ResearchJobStatus.DRAFTING,
];

function requireResearchWrite(req: AuthRequest, res: Response, next: () => void): void {
  const user = req.user;
  if (!user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  if (!WRITE_ROLES.includes(user.role as UserRole)) {
    res.status(403).json({ error: 'Editor access required' });
    return;
  }
  next();
}

// TR-aware slug for draft posts. Lives here (not src/lib/slugify — that is a
// frontend module) and keeps the route self-contained for supertest.
export function researchSlug(title: string): string {
  const folded = title
    .toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '');
  const slug = folded
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 180);
  return slug.length >= 3 ? slug : `arastirma-${slug}`.slice(0, 180);
}

// SEO meta title: ≤60 chars, cut on a word boundary (mid-word truncation
// reads broken in SERPs). Exported for tests.
export function clampMetaTitle(title: string): string {
  const t = title.trim();
  if (t.length <= 60) return t;
  const cut = t.slice(0, 60);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 30 ? cut.slice(0, lastSpace) : cut).trim();
}

function withSources(body: string, sources: DraftPayload['sources'], heading: string): string {
  const list = sources ?? [];
  if (list.length === 0) return body;
  const lines = list.map((s) => (s.url ? `- [${s.title}](${s.url})` : `- ${s.title}`));
  return `${body}\n\n## ${heading}\n\n${lines.join('\n')}\n`;
}

function readingTime(body: string): number {
  const words = body.split(/\s+/).filter(Boolean).length;
  return Math.min(120, Math.max(1, Math.ceil(words / 200)));
}

// ─── Admin plane (JWT) ───────────────────────────────────────────────────────

// POST /api/v1/admin/research/jobs — queue a NotebookLM research job.
adminResearchRouter.post(
  '/jobs',
  authenticate,
  requireResearchWrite,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const parsed = CreateResearchJobSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
      return;
    }
    const job = await prisma.researchJob.create({
      data: { ...parsed.data, requestedById: req.user!.id },
    });
    await prisma.auditLog.create({
      data: {
        adminId: req.user!.id,
        action: 'RESEARCH_JOB_CREATE',
        targetType: 'ResearchJob',
        targetId: job.id,
        newValue: { topic: job.topic, mode: job.mode } as never,
        ip: req.ip,
      },
    });
    res.status(201).json({ status: 'ok', data: job });
  },
);

// GET /api/v1/admin/research/jobs — list + bridge liveness meta.
adminResearchRouter.get(
  '/jobs',
  authenticate,
  requireResearchWrite,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const query = JobListQuerySchema.safeParse(req.query);
    if (!query.success) {
      res.status(400).json({ error: 'Invalid query', details: query.error.flatten() });
      return;
    }
    const { status, page, limit } = query.data;
    const where = status ? { status } : {};
    const [items, total, lastBridgeTouch] = await Promise.all([
      prisma.researchJob.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.researchJob.count({ where }),
      prisma.researchJob.findFirst({
        where: { status: { not: ResearchJobStatus.QUEUED } },
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true },
      }),
    ]);
    const lastSeenMs = Math.max(
      lastBridgeTouch?.updatedAt.getTime() ?? 0,
      readHeartbeatMs(req.app),
    );
    const bridgeAlive = lastSeenMs > 0 && Date.now() - lastSeenMs < BRIDGE_ALIVE_WINDOW_MS;
    res.json({
      status: 'ok',
      data: {
        items,
        total,
        page,
        limit,
        bridgeAlive,
        lastBridgeSeenAt: lastSeenMs > 0 ? new Date(lastSeenMs) : null,
      },
    });
  },
);

// GET /api/v1/admin/research/jobs/:id
adminResearchRouter.get(
  '/jobs/:id',
  authenticate,
  requireResearchWrite,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const job = await prisma.researchJob.findUnique({ where: { id: req.params.id } });
    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }
    res.json({ status: 'ok', data: job });
  },
);

// POST /api/v1/admin/research/jobs/:id/cancel — only while still QUEUED.
adminResearchRouter.post(
  '/jobs/:id/cancel',
  authenticate,
  requireResearchWrite,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { count } = await prisma.researchJob.updateMany({
      where: { id: req.params.id, status: ResearchJobStatus.QUEUED },
      data: { status: ResearchJobStatus.CANCELLED, finishedAt: new Date() },
    });
    if (count === 0) {
      res.status(409).json({ error: 'Job is not cancellable (already claimed or finished)' });
      return;
    }
    res.json({ status: 'ok' });
  },
);

// ─── Bridge plane (ApiKey, scope research:bridge) ────────────────────────────

const bridgeAuth = apiKeyAuth({ requiredScopes: [BRIDGE_SCOPE] });

// POST /api/v1/admin/research/bridge/claim — atomically claim the oldest
// QUEUED job. Optimistic guard (updateMany on id+QUEUED) makes double-claim
// races resolve to exactly one winner.
adminResearchRouter.post('/bridge/claim', bridgeAuth, async (req, res): Promise<void> => {
  req.app.locals[HEARTBEAT_KEY] = Date.now();
  const candidate = await prisma.researchJob.findFirst({
    where: { status: ResearchJobStatus.QUEUED },
    orderBy: { createdAt: 'asc' },
  });
  if (!candidate) {
    res.status(204).end();
    return;
  }
  const { count } = await prisma.researchJob.updateMany({
    where: { id: candidate.id, status: ResearchJobStatus.QUEUED },
    data: { status: ResearchJobStatus.CLAIMED, claimedAt: new Date() },
  });
  if (count === 0) {
    // Lost the race to another bridge instance — report empty, next poll wins.
    res.status(204).end();
    return;
  }
  const job = await prisma.researchJob.findUnique({ where: { id: candidate.id } });
  res.json({ status: 'ok', data: job });
});

// PATCH /api/v1/admin/research/bridge/jobs/:id — stage/progress updates and
// final delivery. On status=DONE the draft payload is materialised as a
// BlogPost(DRAFT); the bridge never touches the post afterwards
// (single-writer handoff — the admin edits in the Insights editor).
adminResearchRouter.patch('/bridge/jobs/:id', bridgeAuth, async (req, res): Promise<void> => {
  const parsed = BridgePatchSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    return;
  }
  const patch = parsed.data;

  const job = await prisma.researchJob.findUnique({ where: { id: req.params.id } });
  if (!job) {
    res.status(404).json({ error: 'Job not found' });
    return;
  }
  if (!ACTIVE_STATUSES.includes(job.status)) {
    res.status(409).json({ error: `Job is ${job.status}; bridge may only update in-flight jobs` });
    return;
  }

  if (patch.status === 'DONE') {
    const draftParsed = DraftPayloadSchema.safeParse(patch.draft);
    if (!draftParsed.success) {
      res.status(400).json({
        error: 'DONE requires a valid draft payload',
        details: draftParsed.error.flatten(),
      });
      return;
    }
    const draft = draftParsed.data;

    const author =
      (await prisma.author.findFirst({ where: { isFounder: true } })) ??
      (await prisma.author.findFirst());
    if (!author) {
      res
        .status(422)
        .json({ error: 'No Author row exists; seed an author before delivering drafts' });
      return;
    }

    const body = withSources(draft.bodyTrMdx, draft.sources, 'Kaynaklar');
    // EN leg: the schema refine guarantees all-or-none; the triple check here
    // narrows the optionals for strict TS. Present trio → language BOTH.
    const enLeg =
      draft.titleEn !== undefined && draft.excerptEn !== undefined && draft.bodyEnMdx !== undefined
        ? {
            titleEn: draft.titleEn,
            excerptEn: draft.excerptEn,
            bodyEnMdx: withSources(draft.bodyEnMdx, draft.sources, 'Sources'),
          }
        : null;
    // Rich-draft mapping: bridge-provided values win, then env, then default.
    const coverImageUrl =
      draft.coverImageUrl ??
      process.env.RESEARCH_DEFAULT_COVER_URL ??
      'https://ecypro.com/og-default.jpg';
    const coverImageAlt = draft.coverImageAlt ?? `${draft.titleTr} — NotebookLM araştırma görseli`;
    const metaTitleTr = draft.metaTitleTr ?? clampMetaTitle(draft.titleTr);
    // Auto-file under the domain's first category; absent seed → uncategorised
    // (the editor dropdown assigns one later).
    const category = await prisma.insightCategory
      .findFirst({
        where: { domain: job.primaryDomain },
        orderBy: { displayOrder: 'asc' },
        select: { id: true },
      })
      .catch(() => null);

    const base = researchSlug(draft.titleTr);
    const baseEn = enLeg ? researchSlug(enLeg.titleEn) : null;
    let post: { id: string } | null = null;
    for (let attempt = 0; attempt < 3 && !post; attempt += 1) {
      // Same suffix for both slug columns: a P2002 on EITHER unique index
      // retries the pair together, so they stay visually paired.
      const suffix = Date.now().toString(36);
      const slug = attempt === 0 ? base : `${base}-${suffix}`;
      try {
        post = await prisma.blogPost.create({
          data: {
            slug,
            type: 'ANALYSIS',
            language: enLeg ? 'BOTH' : 'TR_ONLY',
            titleTr: draft.titleTr,
            excerptTr: draft.excerptTr,
            bodyTrMdx: body,
            ...(enLeg && baseEn
              ? {
                  slugEn: attempt === 0 ? baseEn : `${baseEn}-${suffix}`,
                  titleEn: enLeg.titleEn,
                  excerptEn: enLeg.excerptEn,
                  bodyEnMdx: enLeg.bodyEnMdx,
                  metaTitleEn: clampMetaTitle(enLeg.titleEn),
                  metaDescEn: enLeg.excerptEn.slice(0, 160),
                }
              : {}),
            primaryDomain: job.primaryDomain,
            subDomain: 'notebooklm-research',
            topic: job.topic.slice(0, 100),
            authorId: author.id,
            ...(category ? { categoryId: category.id } : {}),
            coverImageUrl,
            coverImageAlt,
            ogImageUrl: coverImageUrl,
            metaTitleTr,
            metaDescTr: draft.metaDescTr,
            readingTimeMin: readingTime(body),
          },
          select: { id: true },
        });
      } catch (err) {
        // P2002 = unique slug collision → retry with suffix; anything else rethrows.
        if (!(err instanceof Prisma.PrismaClientKnownRequestError) || err.code !== 'P2002') {
          throw err;
        }
      }
    }
    if (!post) {
      res.status(500).json({ error: 'Could not allocate a unique slug for the draft' });
      return;
    }

    const updated = await prisma.researchJob.update({
      where: { id: job.id },
      data: {
        status: ResearchJobStatus.DONE,
        stageDetail: patch.stageDetail ?? 'Draft delivered',
        notebookId: patch.notebookId ?? job.notebookId,
        sourceCount: patch.sourceCount ?? job.sourceCount,
        reportTitle: patch.reportTitle ?? job.reportTitle,
        postId: post.id,
        finishedAt: new Date(),
      },
    });
    await prisma.auditLog.create({
      data: {
        adminId: job.requestedById,
        action: 'RESEARCH_DRAFT_DELIVERED',
        targetType: 'BlogPost',
        targetId: post.id,
        newValue: { jobId: job.id, titleTr: draft.titleTr } as never,
        ip: req.ip,
      },
    });
    logger.info('[research-bridge] draft delivered', { jobId: job.id, postId: post.id });
    res.json({ status: 'ok', data: updated });
    return;
  }

  const updated = await prisma.researchJob.update({
    where: { id: job.id },
    data: {
      ...(patch.status && { status: patch.status as ResearchJobStatus }),
      ...(patch.stageDetail !== undefined && { stageDetail: patch.stageDetail }),
      ...(patch.notebookId !== undefined && { notebookId: patch.notebookId }),
      ...(patch.sourceCount !== undefined && { sourceCount: patch.sourceCount }),
      ...(patch.reportTitle !== undefined && { reportTitle: patch.reportTitle }),
      ...(patch.error !== undefined && { error: patch.error }),
      ...(patch.status === 'FAILED' && { finishedAt: new Date() }),
    },
  });
  res.json({ status: 'ok', data: updated });
});
