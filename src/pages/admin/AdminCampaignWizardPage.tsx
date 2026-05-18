/**
 * P57.7 — Campaign 4-step wizard.
 *
 * Step 1: Audience filter (source + consentOnly)
 * Step 2: Compose (subject + MJML/HTML body)
 * Step 3: Preview (basic HTML render)
 * Step 4: Send/Save draft + Test send
 *
 * Backend: POST /api/admin/newsletter/campaigns (P55) +
 *          POST /api/admin/newsletter/campaigns/test (yeni).
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Check, ArrowLeft, ArrowRight, Send, Save, TestTube2 } from 'lucide-react';
import { apiClient } from '../../lib/api';
import { Breadcrumb, FormField, fieldClassName } from '../../components/admin/ui';

interface CampaignDraft {
  source: string;
  consentOnly: boolean;
  subject: string;
  body: string;
  templateKey: string;
}

const STEPS = ['Audience', 'Compose', 'Önizleme', 'Gönder'] as const;

export const AdminCampaignWizardPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<CampaignDraft>({
    source: '',
    consentOnly: true,
    subject: '',
    body: '',
    templateKey: 'welcome',
  });
  const [testEmail, setTestEmail] = useState('');

  const create = useMutation({
    mutationFn: (payload: CampaignDraft) =>
      apiClient.post('/admin/newsletter/campaigns', {
        subject: payload.subject,
        body: payload.body,
        templateKey: payload.templateKey,
        audienceFilter: { source: payload.source || undefined, consentOnly: payload.consentOnly },
      }),
    onSuccess: () => {
      toast.success('Kampanya taslağı oluşturuldu');
      navigate('/admin/newsletter/campaigns');
    },
    onError: () => toast.error('Oluşturma başarısız oldu'),
  });

  const testSend = useMutation({
    mutationFn: () =>
      apiClient.post('/admin/newsletter/campaigns/test', {
        to: testEmail,
        subject: draft.subject,
        body: draft.body,
      }),
    onSuccess: () => toast.success('Test gönderildi'),
    onError: () => toast.error('Test gönderimi başarısız oldu'),
  });

  const next = () => setStep((s) => Math.min(STEPS.length - 1, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: 'Yönetim', to: '/admin' },
        { label: 'Bülten', to: '/admin/newsletter' },
        { label: 'Kampanyalar', to: '/admin/newsletter/campaigns' },
        { label: 'Yeni' },
      ]} />

      <header>
        <h1 className="text-2xl font-serif font-bold text-white">Yeni Kampanya</h1>
        <p className="text-sm text-slate-400 mt-1">4 adımda kampanya oluşturun.</p>
      </header>

      {/* Stepper */}
      <ol className="flex items-center gap-2 flex-wrap">
        {STEPS.map((label, idx) => {
          const active = idx === step;
          const done = idx < step;
          return (
            <li key={label} className="flex items-center gap-2">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold ${
                done ? 'bg-secondary/15 text-secondary border border-secondary/30'
                  : active ? 'bg-secondary text-neutral'
                  : 'bg-white/5 text-slate-400 border border-white/10'
              }`}>
                <span className="w-5 h-5 rounded-full bg-current/15 flex items-center justify-center text-xs">
                  {done ? <Check size={11} /> : idx + 1}
                </span>
                {label}
              </div>
              {idx < STEPS.length - 1 && <span className="text-slate-600 text-xs">→</span>}
            </li>
          );
        })}
      </ol>

      <div className="bg-white/[0.02] border border-white/10 rounded-xl p-6">
        {step === 0 && (
          <div className="space-y-4 max-w-xl">
            <h2 className="text-sm font-semibold text-white mb-2">Hedef Kitle</h2>
            <FormField label="Kaynak Filtresi" tooltip="Boş bırakırsanız tüm aboneler" hint="footer / exit-intent / blog-cta">
              <input type="text" value={draft.source} onChange={(e) => setDraft({ ...draft, source: e.target.value })} className={fieldClassName} />
            </FormField>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" checked={draft.consentOnly} onChange={(e) => setDraft({ ...draft, consentOnly: e.target.checked })} />
              Sadece çift-onaylı aboneler (KVKK)
            </label>
          </div>
        )}
        {step === 1 && (
          <div className="space-y-4 max-w-3xl">
            <h2 className="text-sm font-semibold text-white mb-2">İçerik</h2>
            <FormField label="Konu" required>
              <input type="text" value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value })} className={fieldClassName} maxLength={150} />
            </FormField>
            <FormField label="Şablon" tooltip="MJML şablonu (server/emails/mjml/<key>.mjml)">
              <select value={draft.templateKey} onChange={(e) => setDraft({ ...draft, templateKey: e.target.value })} className={fieldClassName}>
                <option value="welcome">welcome</option>
                <option value="methodology">methodology</option>
                <option value="case-study">case-study</option>
                <option value="discovery-call-confirm">discovery-call-confirm</option>
                <option value="newsletter-confirm">newsletter-confirm</option>
              </select>
            </FormField>
            <FormField label="Gövde (Markdown veya HTML)" required>
              <textarea value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} className={`${fieldClassName} min-h-[260px] font-mono text-xs`} />
            </FormField>
          </div>
        )}
        {step === 2 && (
          <div className="max-w-3xl">
            <h2 className="text-sm font-semibold text-white mb-2">Önizleme</h2>
            <div className="bg-white text-neutral rounded-xl p-6 shadow-2xl">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-2">eCyPro Premium Consulting</p>
              <h3 className="text-xl font-bold mb-3">{draft.subject || '(Konu yok)'}</h3>
              <div className="text-sm whitespace-pre-wrap text-slate-700">{draft.body || '(Gövde yok)'}</div>
            </div>
            <p className="text-xs text-slate-500 mt-3">Bu basit önizleme; final HTML render MJML üzerinden yapılır.</p>
          </div>
        )}
        {step === 3 && (
          <div className="space-y-4 max-w-2xl">
            <h2 className="text-sm font-semibold text-white mb-2">Gönder</h2>
            <FormField label="Test Gönderim Adresi" hint="Önce kendinize test gönderin">
              <div className="flex gap-2">
                <input type="email" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} className={`${fieldClassName} flex-1`} placeholder="emre@ecypro.com" />
                <button
                  type="button"
                  disabled={!testEmail || testSend.isPending}
                  onClick={() => testSend.mutate()}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 text-white text-sm hover:bg-white/10 disabled:opacity-50"
                >
                  <TestTube2 size={14} /> {testSend.isPending ? 'Gönderiliyor…' : 'Test Gönder'}
                </button>
              </div>
            </FormField>
            <div className="flex gap-2 pt-4 border-t border-white/5">
              <button
                type="button"
                onClick={() => create.mutate(draft)}
                disabled={create.isPending || !draft.subject || !draft.body}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-secondary text-neutral font-semibold disabled:opacity-50"
              >
                <Save size={14} /> Taslak Olarak Kaydet
              </button>
              <p className="text-xs text-slate-500 self-center">Gerçek gönderim Kampanyalar listesinden "Gönder" ile yapılır.</p>
            </div>
          </div>
        )}
      </div>

      <footer className="flex justify-between">
        <button
          type="button"
          onClick={back}
          disabled={step === 0}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 text-white text-sm hover:bg-white/10 disabled:opacity-30"
        >
          <ArrowLeft size={14} /> Geri
        </button>
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={next}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-secondary text-neutral font-semibold"
          >
            Sonraki <ArrowRight size={14} />
          </button>
        ) : (
          <span />
        )}
      </footer>
    </div>
  );
};

export default AdminCampaignWizardPage;
