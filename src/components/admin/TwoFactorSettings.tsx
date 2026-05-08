/**
 * P35-T04-UI: Admin 2FA Settings Component
 *
 * States:
 *   idle (2FA disabled) → Setup initiated → QR scanned → Code verified → enabled
 *   enabled             → Disable flow (requires current TOTP code)
 *   enabled             → Regenerate backup codes
 *
 * Security UX:
 *   - QR code displayed only during setup; never stored client-side
 *   - Backup codes shown only ONCE after setup; user must acknowledge
 *   - Manual entry key (base32 secret) shown as text fallback for authenticator apps
 */

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Shield,
  ShieldCheck,
  QrCode,
  Copy,
  AlertTriangle,
  CheckCircle,
  Loader2,
  X,
  KeyRound,
} from 'lucide-react';
import { apiClient } from '../../lib/api';

interface SetupData {
  qrCodeDataUrl: string;
  otpauthUrl: string;
  manualEntryKey: string;
}

interface TwoFactorStatusResponse {
  status: string;
  data: { totpEnabled: boolean };
}

interface SetupResponse {
  status: string;
  data: SetupData;
}

interface VerifyResponse {
  status: string;
  data: { message: string; backupCodes: string[] };
}

type Step = 'idle' | 'setup-qr' | 'setup-verify' | 'show-backup' | 'disable';

export const TwoFactorSettings: React.FC = () => {
  const [step, setStep] = useState<Step>('idle');
  const [token, setToken] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [setupData, setSetupData] = useState<SetupData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const queryClient = useQueryClient();

  // Fetch 2FA status
  const { data: statusData } = useQuery<TwoFactorStatusResponse>({
    queryKey: ['admin', '2fa-status'],
    queryFn: () => apiClient.get('/auth/me').then((r) => r.data),
    retry: false,
  });
  const is2FAEnabled = statusData?.data?.totpEnabled ?? false;

  // Setup: generate QR
  const setupMutation = useMutation({
    mutationFn: () => apiClient.post<SetupResponse>('/auth/2fa/setup').then((r) => r.data),
    onSuccess: (data) => {
      setSetupData(data.data);
      setStep('setup-qr');
      setError(null);
    },
    onError: (e: Error) => setError(e.message),
  });

  // Verify setup code
  const verifySetupMutation = useMutation({
    mutationFn: (code: string) =>
      apiClient.post<VerifyResponse>('/auth/2fa/verify-setup', { token: code }).then((r) => r.data),
    onSuccess: (data) => {
      setBackupCodes(data.data.backupCodes);
      setStep('show-backup');
      setError(null);
      void queryClient.invalidateQueries({ queryKey: ['admin', '2fa-status'] });
    },
    onError: () => setError('Geçersiz kod. Authenticator uygulamanızı kontrol edin.'),
  });

  // Disable 2FA
  const disableMutation = useMutation({
    mutationFn: (code: string) =>
      apiClient.post('/auth/2fa/disable', { token: code }).then((r) => r.data),
    onSuccess: () => {
      setStep('idle');
      setToken('');
      setError(null);
      void queryClient.invalidateQueries({ queryKey: ['admin', '2fa-status'] });
    },
    onError: () => setError('Geçersiz kod. 2FA devre dışı bırakılamadı.'),
  });

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => {
    setStep('idle');
    setToken('');
    setError(null);
    setSetupData(null);
    setBackupCodes([]);
  };

  return (
    <div className="bg-white/3 border border-white/8 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        {is2FAEnabled ? (
          <ShieldCheck size={20} className="text-green-400" />
        ) : (
          <Shield size={20} className="text-slate-400" />
        )}
        <div>
          <h3 className="text-sm font-semibold text-white">İki Faktörlü Kimlik Doğrulama</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {is2FAEnabled
              ? '2FA aktif — hesabınız korunuyor'
              : 'Google Authenticator ile hesabınızı güvence altına alın'}
          </p>
        </div>
        <span
          className={`ml-auto text-xs font-semibold px-2.5 py-1 rounded-full ${
            is2FAEnabled ? 'bg-green-500/15 text-green-400' : 'bg-slate-700 text-slate-400'
          }`}
        >
          {is2FAEnabled ? 'Aktif' : 'Devre Dışı'}
        </span>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-4">
          <AlertTriangle size={13} />
          {error}
        </div>
      )}

      {/* ── IDLE: 2FA disabled ─────────────────────────────── */}
      {step === 'idle' && !is2FAEnabled && (
        <button
          onClick={() => setupMutation.mutate()}
          disabled={setupMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 bg-secondary text-white rounded-lg text-sm font-medium hover:bg-secondary/90 transition-colors disabled:opacity-50"
        >
          {setupMutation.isPending ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <QrCode size={14} />
          )}
          2FA Kurulumunu Başlat
        </button>
      )}

      {/* ── 2FA ENABLED controls ───────────────────────────── */}
      {step === 'idle' && is2FAEnabled && (
        <div className="flex gap-3">
          <button
            onClick={() => setStep('disable')}
            className="px-4 py-2 border border-red-500/30 text-red-400 rounded-lg text-sm hover:bg-red-500/10 transition-colors"
          >
            Devre Dışı Bırak
          </button>
        </div>
      )}

      {/* ── QR CODE DISPLAY ───────────────────────────────── */}
      {step === 'setup-qr' && setupData && (
        <div className="space-y-4">
          <p className="text-xs text-slate-400">
            Google Authenticator veya Authy uygulamasını açın ve QR kodu tarayın.
          </p>
          <div className="flex justify-center">
            <img
              src={setupData.qrCodeDataUrl}
              alt="2FA QR Code"
              className="w-48 h-48 rounded-xl border border-white/10"
            />
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Manuel giriş kodu:</p>
            <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
              <code className="text-xs text-secondary font-mono flex-1 break-all">
                {setupData.manualEntryKey}
              </code>
              <button
                onClick={() => copyToClipboard(setupData.manualEntryKey)}
                className="shrink-0"
              >
                {copied ? (
                  <CheckCircle size={13} className="text-green-400" />
                ) : (
                  <Copy size={13} className="text-slate-400" />
                )}
              </button>
            </div>
          </div>
          <button
            onClick={() => setStep('setup-verify')}
            className="w-full px-4 py-2 bg-secondary text-white rounded-lg text-sm font-medium hover:bg-secondary/90 transition-colors"
          >
            QR Taradım → Kodu Girin
          </button>
        </div>
      )}

      {/* ── VERIFY CODE ───────────────────────────────────── */}
      {(step === 'setup-verify' || step === 'disable') && (
        <div className="space-y-3">
          <p className="text-xs text-slate-400">
            {step === 'disable'
              ? '2FA devre dışı bırakmak için mevcut 6 haneli kodu girin.'
              : 'Authenticator uygulamasındaki 6 haneli kodu girin.'}
          </p>
          <input
            type="text"
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            value={token}
            onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
            placeholder="000000"
            ref={(el) => el?.focus()}
            className="w-full text-center text-2xl tracking-[0.5em] font-mono bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-secondary"
          />
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (step === 'setup-verify') verifySetupMutation.mutate(token);
                else disableMutation.mutate(token);
              }}
              disabled={
                token.length !== 6 || verifySetupMutation.isPending || disableMutation.isPending
              }
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-secondary text-white rounded-lg text-sm font-medium hover:bg-secondary/90 transition-colors disabled:opacity-50"
            >
              {verifySetupMutation.isPending || disableMutation.isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : null}
              {step === 'disable' ? 'Devre Dışı Bırak' : 'Doğrula & Etkinleştir'}
            </button>
            <button onClick={reset} className="px-3 py-2 text-slate-400 hover:text-white">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── BACKUP CODES ─────────────────────────────────── */}
      {step === 'show-backup' && backupCodes.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-amber-400 text-xs bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
            <AlertTriangle size={13} />
            Bu yedek kodlar yalnızca <strong>bir kez</strong> gösterilir. Güvenli bir yere kaydedin!
          </div>
          <div className="grid grid-cols-2 gap-2">
            {backupCodes.map((code, i) => (
              <code
                key={i}
                className="bg-white/5 text-secondary text-xs font-mono px-3 py-2 rounded-lg text-center tracking-widest"
              >
                {code}
              </code>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => copyToClipboard(backupCodes.join('\n'))}
              className="flex items-center gap-2 px-3 py-2 text-xs text-slate-400 hover:text-white border border-white/10 rounded-lg transition-colors"
            >
              <KeyRound size={12} />
              {copied ? 'Kopyalandı!' : 'Tümünü Kopyala'}
            </button>
            <button
              onClick={reset}
              className="ml-auto flex items-center gap-2 px-4 py-2 bg-secondary/20 text-secondary rounded-lg text-xs font-medium hover:bg-secondary/30 transition-colors"
            >
              <CheckCircle size={13} />
              Kaydettim, Tamamla
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
