/**
 * P35-T09: Admin Session Management Dashboard
 *
 * Displays all active sessions for the current user.
 * Admin can also view/revoke sessions for any user via
 *   GET /api/admin/users/:userId/sessions
 *
 * Features:
 *   - Session list with IP, browser, device parsed from UA
 *   - Current session badge (can't revoke own current session)
 *   - Individual revoke: DELETE /api/sessions/:id
 *   - Revoke all others: DELETE /api/sessions
 *   - Last seen timestamp + relative "X minutes ago" display
 *
 * Security model:
 *   - Revoking = add JTI to Redis blacklist + mark revokedAt
 *   - Next request with revoked token → 401 (auth middleware checks blacklist)
 *   - Session data comes from Prisma Session model (userId, jti, ip, userAgent)
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  Shield,
  ShieldAlert,
  LogOut,
  Loader2,
  RefreshCw,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { apiClient } from '../../lib/api';

interface Session {
  id: string;
  jti: string;
  userAgent: string | null;
  ip: string | null;
  createdAt: string;
  lastSeenAt: string;
  isCurrent: boolean;
}

interface SessionsResponse {
  status: string;
  data: Session[];
}

// ─── User-Agent parsing (client-side heuristic) ──────────────

function parseDevice(ua: string | null): { device: string; browser: string; os: string } {
  if (!ua) return { device: 'Unknown', browser: 'Unknown', os: 'Unknown' };

  const device = /Mobile|Android|iPhone/i.test(ua)
    ? 'Mobile'
    : /iPad|Tablet/i.test(ua)
      ? 'Tablet'
      : 'Desktop';

  const browser =
    /Chrome\/[\d.]+/.test(ua) && !/Edg|OPR/i.test(ua)
      ? 'Chrome'
      : /Firefox\/[\d.]+/.test(ua)
        ? 'Firefox'
        : /Safari\/[\d.]+/.test(ua) && !/Chrome/i.test(ua)
          ? 'Safari'
          : /Edg\/[\d.]+/.test(ua)
            ? 'Edge'
            : /OPR\/[\d.]+/.test(ua)
              ? 'Opera'
              : 'Unknown';

  const os = /Windows NT/.test(ua)
    ? 'Windows'
    : /Mac OS X/.test(ua)
      ? 'macOS'
      : /Linux/.test(ua) && !/Android/i.test(ua)
        ? 'Linux'
        : /Android/.test(ua)
          ? 'Android'
          : /iPhone|iPad/.test(ua)
            ? 'iOS'
            : 'Unknown';

  return { device, browser, os };
}

function DeviceIcon({ device }: { device: string }) {
  const cls = 'text-slate-400 shrink-0';
  if (device === 'Mobile') return <Smartphone size={18} className={cls} />;
  if (device === 'Tablet') return <Tablet size={18} className={cls} />;
  return <Monitor size={18} className={cls} />;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'Az önce';
  if (minutes < 60) return `${minutes} dakika önce`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} saat önce`;
  const days = Math.floor(hours / 24);
  return `${days} gün önce`;
}

// ─── Component ───────────────────────────────────────────────

export const AdminSessionsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [revokedId, setRevokedId] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery<SessionsResponse>({
    queryKey: ['admin-own-sessions'],
    queryFn: () => apiClient.get<SessionsResponse>('/sessions').then((r) => r.data),
    staleTime: 30_000,
  });

  const revokeMutation = useMutation({
    mutationFn: (sessionId: string) => apiClient.delete(`/sessions/${sessionId}`),
    onMutate: (sessionId) => setRevokedId(sessionId),
    onSettled: () => {
      setRevokedId(null);
      queryClient.invalidateQueries({ queryKey: ['admin-own-sessions'] });
    },
  });

  const revokeAllMutation = useMutation({
    mutationFn: () => apiClient.delete('/sessions'),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['admin-own-sessions'] }),
  });

  const sessions = data?.data ?? [];
  const activeSessions = sessions.filter((s) => !s.isCurrent);
  const currentSession = sessions.find((s) => s.isCurrent);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Shield className="text-secondary" size={24} />
            Aktif Oturumlar
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Aktif cihazlarınızı görün ve yetkisiz oturumları sonlandırın
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button type="button"
            onClick={() => refetch()}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-colors text-sm"
          >
            <RefreshCw size={14} /> Yenile
          </button>
          {activeSessions.length > 0 && (
            <button type="button"
              onClick={() => revokeAllMutation.mutate()}
              disabled={revokeAllMutation.isPending}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors text-sm disabled:opacity-50"
            >
              {revokeAllMutation.isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <ShieldAlert size={14} />
              )}
              Diğer Tüm Oturumları Sonlandır ({activeSessions.length})
            </button>
          )}
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl px-4 py-3 flex items-start gap-3">
        <ShieldAlert size={16} className="text-amber-400 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-200/80 leading-relaxed">
          Tanımadığınız bir cihaz veya konum görüyorsanız o oturumu hemen sonlandırın ve şifrenizi
          değiştirin. Oturum sonlandırma anında geçerlidir — o cihazda yapılan sonraki istek 401
          alır.
        </p>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={28} className="text-secondary animate-spin" />
        </div>
      )}

      {/* Current Session */}
      {currentSession && (
        <div>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
            Mevcut Oturum
          </h2>
          <SessionCard
            session={currentSession}
            isRevoking={false}
            onRevoke={() => {}} // Can't revoke current session
            disabled
          />
        </div>
      )}

      {/* Other Sessions */}
      {activeSessions.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
            Diğer Aktif Oturumlar ({activeSessions.length})
          </h2>
          <div className="space-y-3">
            {activeSessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                isRevoking={revokedId === session.id || revokeMutation.isPending}
                onRevoke={() => revokeMutation.mutate(session.id)}
                disabled={revokeMutation.isPending}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && sessions.length === 0 && (
        <div className="text-center py-16">
          <CheckCircle size={40} className="text-green-400 mx-auto mb-3" />
          <p className="text-slate-400">Yalnızca bu oturum aktif.</p>
        </div>
      )}

      {/* Empty active sessions */}
      {!isLoading && sessions.length > 0 && activeSessions.length === 0 && (
        <div className="text-center py-8">
          <CheckCircle size={32} className="text-green-400 mx-auto mb-2" />
          <p className="text-sm text-slate-400">Başka aktif oturum yok.</p>
        </div>
      )}
    </div>
  );
};

// ─── SessionCard Component ────────────────────────────────────

interface SessionCardProps {
  session: Session;
  isRevoking: boolean;
  onRevoke: () => void;
  disabled: boolean;
}

const SessionCard: React.FC<SessionCardProps> = ({ session, isRevoking, onRevoke, disabled }) => {
  const { device, browser, os } = parseDevice(session.userAgent);

  return (
    <div
      className={`
      bg-white/3 border rounded-xl p-5 flex items-start gap-4 transition-all
      ${session.isCurrent ? 'border-secondary/30 bg-secondary/5' : 'border-white/5'}
    `}
    >
      {/* Device icon */}
      <div className="mt-0.5">
        <DeviceIcon device={device} />
      </div>

      {/* Session info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-white">
            {browser} · {os}
          </span>
          {session.isCurrent && (
            <span className="text-[10px] font-bold px-2 py-0.5 bg-secondary/20 text-secondary rounded-full border border-secondary/30">
              Bu Cihaz
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
          {session.ip && (
            <span className="flex items-center gap-1">
              <Globe size={11} /> {session.ip}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock size={11} /> Son görülme: {relativeTime(session.lastSeenAt)}
          </span>
          <span className="flex items-center gap-1">
            Başlangıç: {new Date(session.createdAt).toLocaleDateString('tr-TR')}
          </span>
        </div>
      </div>

      {/* Revoke button */}
      {!session.isCurrent && (
        <button type="button"
          onClick={onRevoke}
          disabled={disabled}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-40"
        >
          {isRevoking ? <Loader2 size={12} className="animate-spin" /> : <LogOut size={12} />}
          Sonlandır
        </button>
      )}
    </div>
  );
};

export default AdminSessionsPage;
