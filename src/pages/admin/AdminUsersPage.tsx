import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Search, Shield, ShieldOff, ChevronDown, Calendar, Bookmark } from 'lucide-react';
import { apiClient } from '../../lib/api';

const ROLES = ['USER', 'CLIENT', 'CONSULTANT', 'ADMIN', 'PREMIUM'] as const;
type Role = (typeof ROLES)[number];

const ROLE_COLORS: Record<Role, string> = {
  USER: 'text-slate-400 bg-slate-400/10',
  CLIENT: 'text-blue-400 bg-blue-400/10',
  CONSULTANT: 'text-purple-400 bg-purple-400/10',
  ADMIN: 'text-red-400 bg-red-400/10',
  PREMIUM: 'text-yellow-400 bg-yellow-400/10',
};

interface User {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  _count: { bookings: number };
}

interface ApiResponse {
  status: string;
  data: { items: User[]; total: number };
}

export const AdminUsersPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<ApiResponse>({
    queryKey: ['admin-users', debouncedSearch],
    queryFn: () =>
      apiClient
        .get<ApiResponse>(`/admin/users?limit=100&search=${encodeURIComponent(debouncedSearch)}`)
        .then((r) => r.data),
    staleTime: 15_000,
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      apiClient.patch(`/admin/users/${id}/role`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setEditingRole(null);
    },
  });

  const activeMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiClient.patch(`/admin/users/${id}/active`, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const handleSearch = (val: string) => {
    setSearch(val);
    clearTimeout((window as unknown as { _searchTimer: number })._searchTimer);
    (window as unknown as { _searchTimer: ReturnType<typeof setTimeout> })._searchTimer =
      setTimeout(() => setDebouncedSearch(val), 400);
  };

  const users = data?.data.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Users className="text-secondary" size={24} />
            Users & RBAC
          </h1>
          <p className="text-slate-400 text-sm mt-1">{data?.data.total ?? 0} total users</p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search email or name…"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 text-sm outline-none focus:border-secondary/50"
        />
      </div>

      <div className="bg-white/3 border border-white/5 rounded-2xl overflow-hidden">
        <div className="grid grid-cols-12 text-xs font-medium text-slate-500 uppercase tracking-widest px-6 py-3 border-b border-white/5">
          <div className="col-span-4">User</div>
          <div className="col-span-2">Role</div>
          <div className="col-span-2">Bookings</div>
          <div className="col-span-2">Last Login</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {isLoading && <div className="text-center py-10 text-slate-400 text-sm">Loading…</div>}
        {!isLoading && users.length === 0 && (
          <div className="text-center py-10 text-slate-400 text-sm">No users found.</div>
        )}

        <div className="divide-y divide-white/5">
          {users.map((u) => (
            <div
              key={u.id}
              className={`grid grid-cols-12 items-center px-6 py-3 transition-colors ${u.isActive ? 'hover:bg-white/2' : 'opacity-60 bg-slate-900/30'}`}
            >
              <div className="col-span-4">
                <p className="text-sm text-white font-medium truncate">{u.name ?? '—'}</p>
                <p className="text-xs text-slate-400 truncate">{u.email}</p>
              </div>

              <div className="col-span-2">
                {editingRole === u.id ? (
                  <select
                    defaultValue={u.role}
                    ref={(el) => el?.focus()}
                    aria-label={`Role for user ${u.id}`}
                    className="text-xs bg-[#0f172a] border border-secondary/30 rounded-lg px-2 py-1 text-white outline-none"
                    onChange={(e) => roleMutation.mutate({ id: u.id, role: e.target.value })}
                    onBlur={() => setEditingRole(null)}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                ) : (
                  <button type="button"
                    onClick={() => setEditingRole(u.id)}
                    className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium cursor-pointer ${ROLE_COLORS[u.role]}`}
                  >
                    {u.role} <ChevronDown size={10} />
                  </button>
                )}
              </div>

              <div className="col-span-2 flex items-center gap-1.5 text-xs text-slate-400">
                <Bookmark size={12} />
                {u._count.bookings}
              </div>

              <div className="col-span-2 text-xs text-slate-400 flex items-center gap-1">
                <Calendar size={11} />
                {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString('tr-TR') : 'Never'}
              </div>

              <div className="col-span-2 flex justify-end">
                <button type="button"
                  onClick={() => activeMutation.mutate({ id: u.id, isActive: !u.isActive })}
                  disabled={activeMutation.isPending}
                  className={`p-1.5 rounded-lg transition-colors ${
                    u.isActive
                      ? 'text-green-400 hover:bg-red-500/10 hover:text-red-400'
                      : 'text-red-400 hover:bg-green-500/10 hover:text-green-400'
                  }`}
                  title={u.isActive ? 'Deactivate' : 'Activate'}
                >
                  {u.isActive ? <Shield size={14} /> : <ShieldOff size={14} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
