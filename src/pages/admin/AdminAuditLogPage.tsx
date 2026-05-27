/**
 * P36-T07: Admin Audit Log Dashboard
 *
 * Displays all admin actions (who did what, when, old/new values).
 * Data source: GET /api/admin/audit-log?page&limit&action
 *
 * Features:
 *   - Paginated audit log table (20 items/page)
 *   - Filter by action type (USER_ROLE_CHANGE, SETTING_UPDATE, etc.)
 *   - Expandable row: JSON diff of oldValue vs newValue
 *   - Color-coded action badges
 *   - Timestamp in local TR format + relative time
 *
 * Security: ADMIN-only route (ProtectedRoute + requireRole in API)
 *
 * AuditLog schema:
 *   id, adminId, action, targetType, targetId,
 *   oldValue (Json), newValue (Json), ip, userAgent, createdAt
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ClipboardList,
  ChevronDown,
  ChevronRight,
  Loader2,
  Filter,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
} from 'lucide-react';
import { apiClient } from '../../lib/api';
import { RbacAuditFilter, type RbacAuditEntry } from '../../components/admin/rbac/RbacAuditFilter';
import { RbacAuditDiffDrawer } from '../../components/admin/rbac/RbacAuditDiffDrawer';

// ─── Types ───────────────────────────────────────────────────

interface AuditLogEntry {
  id: string;
  adminId: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  oldValue: unknown;
  newValue: unknown;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
}

interface AuditLogResponse {
  status: string;
  data: {
    items: AuditLogEntry[];
    total: number;
    page: number;
    limit: number;
  };
}

// ─── RBAC-specific action keys ───────────────────────────────

const RBAC_ACTION_KEYS = ['RBAC_CHANGE', 'VIEW_AS_STARTED', 'VIEW_AS_ENDED'] as const;
type RbacActionKey = (typeof RBAC_ACTION_KEYS)[number];

function isRbacAction(action: string): action is RbacActionKey {
  return (RBAC_ACTION_KEYS as readonly string[]).includes(action);
}

// ─── RBAC audit response ─────────────────────────────────────

interface RbacAuditResponse {
  status: string;
  data: RbacAuditEntry[];
}

// ─── Action badge config ──────────────────────────────────────

const ACTION_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  USER_ROLE_CHANGE: {
    bg: 'bg-purple-500/15 border-purple-500/30',
    text: 'text-purple-400',
    label: 'Rol Değişikliği',
  },
  SETTING_UPDATE: {
    bg: 'bg-blue-500/15 border-blue-500/30',
    text: 'text-blue-400',
    label: 'Ayar Güncelleme',
  },
  BLOG_PUBLISH: {
    bg: 'bg-green-500/15 border-green-500/30',
    text: 'text-green-400',
    label: 'Blog Yayını',
  },
  BOOKING_STATUS: {
    bg: 'bg-amber-500/15 border-amber-500/30',
    text: 'text-amber-400',
    label: 'Booking Durumu',
  },
  USER_ACTIVE_TOGGLE: {
    bg: 'bg-orange-500/15 border-orange-500/30',
    text: 'text-orange-400',
    label: 'Kullanıcı Durumu',
  },
  SESSION_REVOKE: {
    bg: 'bg-red-500/15 border-red-500/30',
    text: 'text-red-400',
    label: 'Oturum İptal',
  },
  CONTACT_READ: {
    bg: 'bg-slate-500/15 border-slate-500/30',
    text: 'text-slate-400',
    label: 'Mesaj Okundu',
  },
  RBAC_CHANGE: {
    bg: 'bg-purple-500/15 border-purple-500/30',
    text: 'text-purple-400',
    label: 'RBAC Değişikliği',
  },
  VIEW_AS_STARTED: {
    bg: 'bg-sky-500/15 border-sky-500/30',
    text: 'text-sky-400',
    label: 'Görünüm Başladı',
  },
  VIEW_AS_ENDED: {
    bg: 'bg-slate-500/15 border-slate-500/30',
    text: 'text-slate-300',
    label: 'Görünüm Bitti',
  },
};

const DEFAULT_ACTION = { bg: 'bg-white/5 border-white/10', text: 'text-slate-400', label: '' };

function getActionConfig(action: string) {
  return ACTION_COLORS[action] ?? { ...DEFAULT_ACTION, label: action };
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'Az önce';
  if (minutes < 60) return `${minutes}dk önce`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}s önce`;
  const days = Math.floor(hours / 24);
  return `${days}g önce`;
}

// ─── Component ───────────────────────────────────────────────

const PAGE_SIZE = 20;

export const AdminAuditLogPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rbacDrawerId, setRbacDrawerId] = useState<string | null>(null);

  // RBAC audit endpoint — fetched only when RBAC_CHANGE filter is active
  const { data: rbacAuditData, isLoading: isRbacLoading } = useQuery<RbacAuditResponse>({
    queryKey: ['admin-rbac-audit'],
    queryFn: () =>
      apiClient.get<RbacAuditResponse>('/admin/rbac/audit?limit=50').then((r) => r.data),
    enabled: actionFilter === 'RBAC_CHANGE',
    staleTime: 30_000,
  });

  const rbacEntries = rbacAuditData?.data ?? [];

  const { data, isLoading: isAuditLoading } = useQuery<AuditLogResponse>({
    queryKey: ['admin-audit-log', page, actionFilter],
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
        ...(actionFilter ? { action: actionFilter } : {}),
      });
      return apiClient
        .get<AuditLogResponse>(`/admin/audit-log?${params.toString()}`)
        .then((r) => r.data);
    },
    staleTime: 30_000,
    // Skip standard query for RBAC-specific filters
    enabled: !isRbacAction(actionFilter),
  });

  const items = data?.data.items ?? [];
  const total = data?.data.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const isLoading = isRbacAction(actionFilter) ? isRbacLoading : isAuditLoading;

  const knownActions = Object.keys(ACTION_COLORS);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <ClipboardList className="text-secondary" size={24} />
          Denetim Kaydı
        </h1>
        <p className="text-slate-400 text-sm mt-1">{total} kayıt · Admin işlem geçmişi</p>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        {/* Standard action filters */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <Filter size={14} /> Filtre:
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setActionFilter('');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                actionFilter === ''
                  ? 'bg-secondary text-white border-secondary'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              Tümü
            </button>
            {knownActions
              // RBAC action keys are handled separately via RbacAuditFilter
              .filter((action) => !isRbacAction(action))
              .map((action) => {
                const cfg = getActionConfig(action);
                return (
                  <button
                    type="button"
                    key={action}
                    onClick={() => {
                      setActionFilter(action);
                      setPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                      actionFilter === action
                        ? `${cfg.bg} ${cfg.text}`
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    {cfg.label}
                  </button>
                );
              })}
          </div>
        </div>

        {/* RBAC-specific filters + CSV export */}
        <RbacAuditFilter
          activeFilter={actionFilter}
          onFilterChange={(filter) => {
            setActionFilter(filter);
            setPage(1);
            setRbacDrawerId(null);
          }}
          entries={actionFilter === 'RBAC_CHANGE' ? rbacEntries : undefined}
        />
      </div>

      {/* RBAC Audit Table — shown when RBAC_CHANGE active */}
      {actionFilter === 'RBAC_CHANGE' && (
        <div className="bg-white/3 border border-white/5 rounded-2xl overflow-hidden">
          {isRbacLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 size={28} className="text-secondary animate-spin" />
            </div>
          ) : rbacEntries.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              RBAC değişiklik kaydı bulunamadı.
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {rbacEntries.map((entry) => {
                const isOpen = rbacDrawerId === entry.id;
                return (
                  <div key={entry.id}>
                    <div
                      role="button"
                      tabIndex={0}
                      aria-expanded={isOpen}
                      className="flex items-start gap-4 px-5 py-4 hover:bg-white/2 transition-colors cursor-pointer"
                      onClick={() => setRbacDrawerId(isOpen ? null : entry.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setRbacDrawerId(isOpen ? null : entry.id);
                        }
                      }}
                    >
                      <div className="mt-0.5 w-4 shrink-0">
                        {isOpen ? (
                          <ChevronDown size={14} className="text-slate-500" />
                        ) : (
                          <ChevronRight size={14} className="text-slate-500" />
                        )}
                      </div>
                      <div className="w-28 shrink-0">
                        <p className="text-xs text-slate-400 font-mono">
                          {new Date(entry.createdAt).toLocaleString('tr-TR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                        <p className="text-[10px] text-slate-600 mt-0.5">
                          {relativeTime(entry.createdAt)}
                        </p>
                      </div>
                      <div className="shrink-0">
                        <span className="text-[10px] font-bold px-2 py-1 rounded-full border bg-purple-500/15 border-purple-500/30 text-purple-400">
                          RBAC Değişikliği
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-300 font-mono">
                          {entry.targetRole} → {entry.targetPermissionKey}
                        </p>
                        {entry.reason && (
                          <p className="text-[11px] text-slate-500 mt-0.5">{entry.reason}</p>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-[11px] text-slate-600 font-mono">
                          {entry.actorId.slice(0, 8)}…
                        </p>
                      </div>
                    </div>
                    {isOpen && (
                      <div className="mx-5 mb-4">
                        <RbacAuditDiffDrawer entry={entry} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Standard Audit Table */}
      {!isRbacAction(actionFilter) && (
        <div className="bg-white/3 border border-white/5 rounded-2xl overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 size={28} className="text-secondary animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">Kayıt bulunamadı.</div>
          ) : (
            <div className="divide-y divide-white/5">
              {items.map((entry) => {
                const cfg = getActionConfig(entry.action);
                const isExpanded = expandedId === entry.id;
                const hasPayload = entry.oldValue !== null || entry.newValue !== null;

                return (
                  <div key={entry.id}>
                    {/* Row */}
                    {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
                    <div
                      role={hasPayload ? 'button' : undefined}
                      tabIndex={hasPayload ? 0 : undefined}
                      aria-expanded={hasPayload ? isExpanded : undefined}
                      className="flex items-start gap-4 px-5 py-4 hover:bg-white/2 transition-colors cursor-pointer"
                      onClick={() => hasPayload && setExpandedId(isExpanded ? null : entry.id)}
                      onKeyDown={(e) => {
                        if (hasPayload && (e.key === 'Enter' || e.key === ' ')) {
                          e.preventDefault();
                          setExpandedId(isExpanded ? null : entry.id);
                        }
                      }}
                    >
                      {/* Expand toggle */}
                      <div className="mt-0.5 w-4 shrink-0">
                        {hasPayload &&
                          (isExpanded ? (
                            <ChevronDown size={14} className="text-slate-500" />
                          ) : (
                            <ChevronRight size={14} className="text-slate-500" />
                          ))}
                      </div>

                      {/* Timestamp */}
                      <div className="w-28 shrink-0">
                        <p className="text-xs text-slate-400 font-mono">
                          {new Date(entry.createdAt).toLocaleString('tr-TR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                        <p className="text-[10px] text-slate-600 mt-0.5">
                          {relativeTime(entry.createdAt)}
                        </p>
                      </div>

                      {/* Action badge */}
                      <div className="shrink-0">
                        <span
                          className={`text-[10px] font-bold px-2 py-1 rounded-full border ${cfg.bg} ${cfg.text}`}
                        >
                          {cfg.label || entry.action}
                        </span>
                      </div>

                      {/* Target */}
                      <div className="flex-1 min-w-0">
                        {entry.targetType && (
                          <p className="text-xs text-slate-300">
                            <span className="text-slate-500">{entry.targetType}:</span>{' '}
                            <span className="font-mono text-slate-400 text-[11px]">
                              {entry.targetId?.slice(0, 8)}…
                            </span>
                          </p>
                        )}
                        {entry.ip && (
                          <p className="text-[11px] text-slate-600 mt-0.5 font-mono">{entry.ip}</p>
                        )}
                      </div>

                      {/* Admin ID */}
                      <div className="shrink-0 text-right">
                        <p className="text-[11px] text-slate-600 font-mono">
                          {entry.adminId.slice(0, 8)}…
                        </p>
                      </div>
                    </div>

                    {/* Expanded: old vs new value diff */}
                    {isExpanded && hasPayload && (
                      <div className="mx-5 mb-4 rounded-xl overflow-hidden border border-white/8">
                        <div className="grid grid-cols-2 divide-x divide-white/8">
                          <div className="p-3">
                            <p className="text-[10px] font-semibold text-red-400 uppercase tracking-widest mb-2">
                              Önceki Değer
                            </p>
                            <pre className="text-[11px] text-slate-400 font-mono overflow-auto max-h-40 whitespace-pre-wrap">
                              {entry.oldValue !== null ? (
                                JSON.stringify(entry.oldValue, null, 2)
                              ) : (
                                <span className="text-slate-600 italic">null</span>
                              )}
                            </pre>
                          </div>
                          <div className="p-3">
                            <p className="text-[10px] font-semibold text-green-400 uppercase tracking-widest mb-2">
                              Yeni Değer
                            </p>
                            <pre className="text-[11px] text-slate-400 font-mono overflow-auto max-h-40 whitespace-pre-wrap">
                              {entry.newValue !== null ? (
                                JSON.stringify(entry.newValue, null, 2)
                              ) : (
                                <span className="text-slate-600 italic">null</span>
                              )}
                            </pre>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Pagination — only for standard audit view */}
      {!isRbacAction(actionFilter) && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} / {total} kayıt
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-xs text-slate-400 px-2">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRightIcon size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAuditLogPage;
