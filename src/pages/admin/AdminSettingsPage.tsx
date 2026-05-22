import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Settings,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Hash,
  Type,
} from 'lucide-react';
import { TwoFactorSettings } from '../../components/admin/TwoFactorSettings';
import { apiClient } from '../../lib/api';

interface ConfigItem {
  id: string;
  key: string;
  value: string;
  type: string;
  label: string | null;
  updatedAt: string;
  updatedBy: string | null;
}

interface ApiResponse {
  status: string;
  data: ConfigItem[];
}

const typeIcon = (type: string) => {
  if (type === 'boolean') return ToggleLeft;
  if (type === 'number') return Hash;
  return Type;
};

export const AdminSettingsPage: React.FC = () => {
  const [localValues, setLocalValues] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<ApiResponse>({
    queryKey: ['admin-settings'],
    queryFn: () => apiClient.get<ApiResponse>('/admin/settings').then((r) => r.data),
    staleTime: 30_000,
  });

  const saveMutation = useMutation({
    mutationFn: (updates: Array<{ key: string; value: string; type?: string; label?: string }>) =>
      apiClient.patch('/admin/settings', updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      setLocalValues({});
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const configs = data?.data ?? [];

  const getValue = (c: ConfigItem) => localValues[c.key] ?? c.value;

  const handleChange = (key: string, value: string) =>
    setLocalValues((prev) => ({ ...prev, [key]: value }));
  const handleToggle = (key: string, current: string) =>
    handleChange(key, current === 'true' ? 'false' : 'true');

  const handleSave = () => {
    const changed = configs
      .filter((c) => localValues[c.key] !== undefined && localValues[c.key] !== c.value)
      .map((c) => ({
        key: c.key,
        value: localValues[c.key]!,
        type: c.type,
        label: c.label ?? undefined,
      }));

    if (changed.length === 0) return;
    saveMutation.mutate(changed);
  };

  const hasChanges = Object.keys(localValues).some(
    (k) => localValues[k] !== configs.find((c) => c.key === k)?.value,
  );

  const settingGroups = configs.reduce<Record<string, ConfigItem[]>>((acc, c) => {
    const group = c.key.split('.')[0] ?? 'general';
    if (!acc[group]) acc[group] = [];
    acc[group].push(c);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Settings className="text-secondary" size={24} />
            Site Settings
          </h1>
          <p className="text-slate-400 text-sm mt-1">Global site configuration</p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={!hasChanges || saveMutation.isPending}
          className="flex items-center gap-2 px-5 py-2.5 bg-secondary text-white rounded-xl font-medium text-sm hover:bg-blue-600 transition-colors disabled:opacity-50"
        >
          {saveMutation.isPending ? (
            <>
              <Loader2 size={14} className="animate-spin" /> Saving…
            </>
          ) : saved ? (
            <>
              <CheckCircle size={14} /> Saved!
            </>
          ) : (
            <>
              <Save size={14} /> Save Changes
            </>
          )}
        </button>
      </div>

      {saveMutation.isError && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm">
          <AlertCircle size={14} /> Save failed — please try again.
        </div>
      )}

      {isLoading && <div className="text-center py-10 text-slate-400">Loading settings…</div>}

      {!isLoading &&
        Object.entries(settingGroups).map(([group, items]) => (
          <div key={group} className="bg-white/3 border border-white/5 rounded-2xl overflow-hidden">
            <div className="px-6 py-3 border-b border-white/5">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                {group.charAt(0).toUpperCase() + group.slice(1)}
              </h3>
            </div>

            <div className="divide-y divide-white/5">
              {items.map((c) => {
                const val = getValue(c);
                const isChanged =
                  localValues[c.key] !== undefined && localValues[c.key] !== c.value;
                const Icon = typeIcon(c.type);

                return (
                  <div
                    key={c.key}
                    className={`px-6 py-4 flex items-center gap-4 ${isChanged ? 'bg-secondary/5' : ''}`}
                  >
                    <Icon size={14} className="text-slate-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">{c.label ?? c.key}</p>
                      <p className="text-xs text-slate-500 font-mono">{c.key}</p>
                    </div>

                    <div className="shrink-0">
                      {c.type === 'boolean' ? (
                        <button
                          type="button"
                          onClick={() => handleToggle(c.key, val)}
                          className={`transition-colors ${val === 'true' ? 'text-green-400' : 'text-slate-500'}`}
                          aria-label={`Toggle ${c.label}`}
                          aria-pressed={val === 'true'}
                        >
                          {val === 'true' ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                        </button>
                      ) : (
                        <input
                          type={c.type === 'number' ? 'number' : 'text'}
                          value={val}
                          onChange={(e) => handleChange(c.key, e.target.value)}
                          className={`w-64 px-3 py-1.5 text-sm bg-white/5 border rounded-lg text-white outline-none focus:border-secondary/50 transition-colors ${
                            isChanged ? 'border-secondary/40' : 'border-white/10'
                          }`}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

      {/* P35-T04-UI: 2FA Settings */}
      <div className="mt-8">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">
          Güvenlik
        </h2>
        <TwoFactorSettings />
      </div>
    </div>
  );
};
