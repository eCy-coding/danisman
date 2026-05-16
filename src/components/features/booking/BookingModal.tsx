/**
 * P37-T01/T06/T07: BookingModal — Real Cal.com Slots + Timezone Display
 *
 * Step 0: Month calendar → select day → fetch real slots from
 *   GET /api/bookings/slots?startDate=&endDate=
 *   Slots are UTC ISO-8601 times from Cal.com (or static fallback).
 *
 * Step 1: Contact form (name, email, company, notes)
 *
 * Step 2: Confirmation summary with dual-timezone display
 *   P37-T07: user's browser timezone detected via Intl API
 *   Shows Istanbul time (primary) + user's local time if different
 *
 * Submit: POST /api/bookings/public (no auth required)
 *   guest flow — finds/creates user by email, sends ICS + confirmation
 */
import React, { useState, useCallback, useMemo } from 'react';
import {
  X,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Check,
  ArrowRight,
  User,
  Mail,
  Building2,
  MessageSquare,
  Loader2,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getUserTimezone, formatBookingTime } from '@/lib/timezone';
import axios from 'axios';

type Lang = 'tr' | 'en';

// ─── API Types ────────────────────────────────────────────────

interface AvailableSlot {
  start: string; // ISO-8601 UTC
  end: string;
}
interface SlotsForDay {
  date: string; // YYYY-MM-DD
  slots: AvailableSlot[];
}
interface SlotsResponse {
  status: string;
  data: SlotsForDay[];
}

// API base URL (same-origin in prod; proxied via Vite in dev)
const API_BASE = import.meta.env.VITE_API_URL ?? '/api';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const COPY = {
  title: { tr: 'Keşif Görüşmesi Planla', en: 'Book Discovery Call' },
  subtitle: {
    tr: '30 dakikalık ücretsiz stratejik danışmanlık görüşmesi',
    en: '30-minute complimentary strategic advisory session',
  },
  step1: { tr: 'Tarih & Saat Seç', en: 'Select Date & Time' },
  step2: { tr: 'Bilgileriniz', en: 'Your Details' },
  step3: { tr: 'Onay', en: 'Confirmation' },
  prev: { tr: 'Geri', en: 'Back' },
  next: { tr: 'Devam', en: 'Continue' },
  confirm: { tr: 'Görüşmeyi Onayla', en: 'Confirm Meeting' },
  name: { tr: 'Ad Soyad', en: 'Full Name' },
  email: { tr: 'E-posta', en: 'Email' },
  company: { tr: 'Şirket', en: 'Company' },
  message: { tr: 'Gündem (isteğe bağlı)', en: 'Agenda (optional)' },
  confirmed: { tr: 'Görüşmeniz Planlandı!', en: 'Meeting Confirmed!' },
  confirmedDesc: {
    tr: 'Onay e-postası kısa süre içinde ulaşacak.',
    en: 'A confirmation email will arrive shortly.',
  },
  close: { tr: 'Kapat', en: 'Close' },
  duration: { tr: '30 dk · Ücretsiz', en: '30 min · Free' },
  timezone: { tr: 'Avrupa/İstanbul (UTC+3)', en: 'Europe/Istanbul (UTC+3)' },
};

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

const MONTHS = {
  tr: [
    'Ocak',
    'Şubat',
    'Mart',
    'Nisan',
    'Mayıs',
    'Haziran',
    'Temmuz',
    'Ağustos',
    'Eylül',
    'Ekim',
    'Kasım',
    'Aralık',
  ],
  en: [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ],
};
const DAYS = {
  tr: ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
};

export const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose }) => {
  const { i18n } = useTranslation();
  const lang = ((i18n.language || 'en').startsWith('tr') ? 'tr' : 'en') as Lang;

  // P37-T07: user timezone detection
  const userTz = useMemo(() => getUserTimezone(), []);

  const today = new Date();
  const [step, setStep] = useState(0);
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [form, setForm] = useState({ name: '', email: '', company: '', message: '' });
  const [done, setDone] = useState(false);

  // ── P37-T01: Fetch real slots for this month ───────────────
  const monthStart = new Date(calYear, calMonth, 1);
  const monthEnd = new Date(calYear, calMonth + 1, 0); // last day
  const { data: slotsData, isLoading: slotsLoading } = useQuery<SlotsResponse>({
    queryKey: ['booking-slots', calYear, calMonth],
    queryFn: () =>
      axios
        .get<SlotsResponse>(
          `${API_BASE}/bookings/slots?startDate=${monthStart.toISOString().slice(0, 10)}&endDate=${monthEnd.toISOString().slice(0, 10)}`,
        )
        .then((r) => r.data),
    enabled: isOpen,
    staleTime: 5 * 60_000,
    retry: 1,
  });

  // Build slot lookup: "YYYY-MM-DD" → AvailableSlot[]
  const slotsByDate = useMemo<Record<string, AvailableSlot[]>>(() => {
    if (!slotsData?.data) return {};
    return Object.fromEntries(slotsData.data.map((d) => [d.date, d.slots]));
  }, [slotsData]);

  // Get slots for selected day, converting UTC → user's display string
  const selectedDayKey =
    selectedDate !== null
      ? `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`
      : null;
  const daySlots: AvailableSlot[] =
    selectedDayKey && slotsByDate[selectedDayKey] ? slotsByDate[selectedDayKey] : [];

  // Format slot start time in user tz (label for button)
  const formatSlotLabel = useCallback(
    (slot: AvailableSlot) => {
      const d = new Date(slot.start);
      return d.toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: userTz,
      });
    },
    [userTz],
  );

  // ── P37-T01: Real submission ───────────────────────────────
  const submitMutation = useMutation({
    mutationFn: () =>
      axios.post(`${API_BASE}/bookings/public`, {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        company: form.company.trim() || undefined,
        notes: form.message.trim() || undefined,
        scheduledAt: selectedSlot!.start,
        durationMin: 30,
      }),
    onSuccess: () => setDone(true),
  });

  const handleClose = useCallback(() => {
    onClose();
    setTimeout(() => {
      setStep(0);
      setSelectedDate(null);
      setSelectedSlot(null);
      setForm({ name: '', email: '', company: '', message: '' });
      setDone(false);
      submitMutation.reset();
    }, 300);
  }, [onClose, submitMutation]);

  const prevMonth = () => {
    if (calMonth === 0) {
      setCalYear((y) => y - 1);
      setCalMonth(11);
    } else setCalMonth((m) => m - 1);
    setSelectedDate(null);
    setSelectedSlot(null);
  };

  const nextMonth = () => {
    if (calMonth === 11) {
      setCalYear((y) => y + 1);
      setCalMonth(0);
    } else setCalMonth((m) => m + 1);
    setSelectedDate(null);
    setSelectedSlot(null);
  };

  const isPastDay = (day: number) => {
    const d = new Date(calYear, calMonth, day);
    d.setHours(0, 0, 0, 0);
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return d < t;
  };

  const isWeekend = (day: number) => {
    const dow = new Date(calYear, calMonth, day).getDay();
    return dow === 0 || dow === 6;
  };

  // Has any real slots available for this day (empty = no slots = visually grey)
  const hasSlots = (day: number) => {
    const key = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return slotsByDate[key] && slotsByDate[key].length > 0;
  };

  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDay = getFirstDayOfMonth(calYear, calMonth);

  // P37-T07: timezone display for confirmation step
  const tzDisplay = selectedSlot
    ? formatBookingTime(new Date(selectedSlot.start), userTz, lang === 'tr' ? 'tr' : 'en')
    : null;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={COPY.title[lang]}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative bg-[#0a0f1c] border border-white/10 rounded-2xl shadow-[0_25px_80px_-10px_rgba(0,0,0,0.8)] w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between px-7 pt-7 pb-5 border-b border-white/5">
          <div>
            <h2 className="text-xl font-bold text-white">{COPY.title[lang]}</h2>
            <p className="text-sm text-slate-400 mt-1">{COPY.subtitle[lang]}</p>
            <div className="flex items-center gap-4 mt-3">
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <Clock size={12} />
                {COPY.duration[lang]}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <Calendar size={12} />
                {COPY.timezone[lang]}
              </span>
            </div>
          </div>
          <button type="button"
            onClick={handleClose}
            className="text-slate-500 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5 -mr-1 -mt-1 outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            aria-label={COPY.close[lang]}
          >
            <X size={20} />
          </button>
        </div>

        {/* Step indicator */}
        {!done && (
          <div className="flex items-center gap-2 px-7 py-4 border-b border-white/5">
            {[COPY.step1[lang], COPY.step2[lang], COPY.step3[lang]].map((label, i) => (
              <React.Fragment key={i}>
                <div
                  className={`flex items-center gap-2 text-xs font-semibold transition-colors ${i === step ? 'text-primary' : i < step ? 'text-secondary' : 'text-slate-600'}`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all ${i === step ? 'bg-primary border-primary text-white' : i < step ? 'bg-secondary/20 border-secondary text-secondary' : 'border-white/10 text-slate-600'}`}
                  >
                    {i < step ? <Check size={10} /> : i + 1}
                  </span>
                  <span className="hidden sm:block">{label}</span>
                </div>
                {i < 2 && (
                  <div
                    className={`flex-1 h-px transition-colors ${i < step ? 'bg-secondary/40' : 'bg-white/5'}`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        )}

        <div className="p-7">
          {/* Step 0: Calendar */}
          {step === 0 && !done && (
            <div>
              {/* Month nav */}
              <div className="flex items-center justify-between mb-5">
                <button type="button"
                  onClick={prevMonth}
                  className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm font-bold text-white">
                  {MONTHS[lang][calMonth]} {calYear}
                </span>
                <button type="button"
                  onClick={nextMonth}
                  className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
              {/* Day headers */}
              <div className="grid grid-cols-7 mb-2">
                {DAYS[lang].map((d) => (
                  <div
                    key={d}
                    className="text-center text-[10px] font-bold text-slate-600 uppercase py-1"
                  >
                    {d}
                  </div>
                ))}
              </div>
              {/* Days grid */}
              <div className="grid grid-cols-7 gap-1 mb-6">
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`e-${i}`} />
                ))}
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                  const disabled = isPastDay(day) || isWeekend(day);
                  const selected = selectedDate === day;
                  return (
                    <button type="button"
                      key={day}
                      disabled={disabled}
                      onClick={() => {
                        setSelectedDate(day);
                        setSelectedSlot(null);
                      }}
                      className={`aspect-square rounded-lg text-sm font-medium transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
                        disabled
                          ? 'text-slate-700 cursor-not-allowed'
                          : !hasSlots(day) && !slotsLoading
                            ? 'text-slate-600 cursor-not-allowed'
                            : selected
                              ? 'bg-primary text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]'
                              : 'text-slate-300 hover:bg-white/8 hover:text-white'
                      }`}
                      title={
                        !hasSlots(day) && !slotsLoading
                          ? lang === 'tr'
                            ? 'Bu gün müsait değil'
                            : 'No slots available'
                          : undefined
                      }
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
              {/* Time slots */}
              {selectedDate !== null && (
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                    {lang === 'tr' ? 'Uygun Saatler' : 'Available Times'}
                    {userTz !== 'Europe/Istanbul' && (
                      <span className="ml-2 text-slate-600 normal-case font-normal">
                        ·{' '}
                        {
                          new Intl.DateTimeFormat(undefined, {
                            timeZoneName: 'short',
                            timeZone: userTz,
                          })
                            .formatToParts(new Date())
                            .find((p) => p.type === 'timeZoneName')?.value
                        }
                      </span>
                    )}
                  </p>
                  {slotsLoading ? (
                    <div className="flex justify-center py-4">
                      <Loader2 size={20} className="text-primary animate-spin" />
                    </div>
                  ) : daySlots.length === 0 ? (
                    <p className="text-xs text-slate-600 text-center py-3">
                      {lang === 'tr'
                        ? 'Bu gün için müsait saat yok.'
                        : 'No available slots for this day.'}
                    </p>
                  ) : (
                    <div className="grid grid-cols-4 gap-2">
                      {daySlots.map((slot) => (
                        <button type="button"
                          key={slot.start}
                          onClick={() => setSelectedSlot(slot)}
                          className={`py-2 rounded-lg text-sm font-semibold transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
                            selectedSlot?.start === slot.start
                              ? 'bg-primary text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]'
                              : 'bg-white/5 border border-white/8 text-slate-300 hover:bg-white/10 hover:text-white hover:border-white/20'
                          }`}
                        >
                          {formatSlotLabel(slot)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 1: Form */}
          {step === 1 && !done && (
            <div className="space-y-4">
              {[
                {
                  key: 'name',
                  label: COPY.name[lang],
                  icon: <User size={14} />,
                  type: 'text',
                  required: true,
                },
                {
                  key: 'email',
                  label: COPY.email[lang],
                  icon: <Mail size={14} />,
                  type: 'email',
                  required: true,
                },
                {
                  key: 'company',
                  label: COPY.company[lang],
                  icon: <Building2 size={14} />,
                  type: 'text',
                  required: false,
                },
              ].map(({ key, label, icon, type, required }) => (
                <div key={key}>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-1.5">
                    {icon}
                    {label}
                    {required && <span className="text-red-400">*</span>}
                  </label>
                  <input
                    type={type}
                    value={form[key as keyof typeof form]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    required={required}
                    className="w-full bg-white/4 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none focus:border-primary/50 focus:bg-white/6 transition-all"
                    placeholder={label}
                  />
                </div>
              ))}
              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-1.5">
                  <MessageSquare size={14} />
                  {COPY.message[lang]}
                </label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  rows={3}
                  className="w-full bg-white/4 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none focus:border-primary/50 focus:bg-white/6 transition-all resize-none"
                  placeholder={
                    lang === 'tr'
                      ? 'Görüşmek istediğiniz konular...'
                      : 'Topics you want to discuss...'
                  }
                />
              </div>
            </div>
          )}

          {/* Step 2: Summary */}
          {step === 2 && !done && (
            <div>
              <div className="bg-white/3 border border-white/8 rounded-xl p-5 space-y-3 mb-5">
                <div className="flex items-center gap-3">
                  <Calendar size={16} className="text-primary shrink-0" />
                  <span className="text-sm text-white font-semibold">
                    {MONTHS[lang][calMonth]} {selectedDate}, {calYear} —{' '}
                    {selectedSlot ? formatSlotLabel(selectedSlot) : ''}
                  </span>
                </div>
                {/* P37-T07: Dual timezone display */}
                {tzDisplay?.showDualTime && (
                  <div className="flex items-center gap-3 pl-7">
                    <span className="text-xs text-slate-500">
                      {lang === 'tr' ? 'İstanbul: ' : 'Istanbul: '}
                      <span className="text-amber-400 font-semibold">{tzDisplay.istanbul}</span>
                      {' · '}
                      {lang === 'tr' ? 'Sizin saatiniz: ' : 'Your time: '}
                      <span className="text-slate-300">
                        {tzDisplay.local} ({tzDisplay.offset})
                      </span>
                    </span>
                  </div>
                )}
                {form.name && (
                  <div className="flex items-center gap-3">
                    <User size={16} className="text-slate-500 shrink-0" />
                    <span className="text-sm text-slate-300">{form.name}</span>
                  </div>
                )}
                {form.email && (
                  <div className="flex items-center gap-3">
                    <Mail size={16} className="text-slate-500 shrink-0" />
                    <span className="text-sm text-slate-300">{form.email}</span>
                  </div>
                )}
                {form.company && (
                  <div className="flex items-center gap-3">
                    <Building2 size={16} className="text-slate-500 shrink-0" />
                    <span className="text-sm text-slate-300">{form.company}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Confirmed */}
          {done && (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-secondary/10 border-2 border-secondary rounded-full flex items-center justify-center mx-auto mb-5">
                <Check size={28} className="text-secondary" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{COPY.confirmed[lang]}</h3>
              <p className="text-slate-400 text-sm mb-1">
                {MONTHS[lang][calMonth]} {selectedDate}, {calYear} ·{' '}
                {selectedSlot ? formatSlotLabel(selectedSlot) : ''}
              </p>
              <p className="text-slate-500 text-sm">{COPY.confirmedDesc[lang]}</p>
              <button type="button"
                onClick={handleClose}
                className="mt-7 btn-premium-gold px-8 py-3 rounded-xl font-bold text-sm uppercase tracking-widest"
              >
                {COPY.close[lang]}
              </button>
            </div>
          )}
        </div>

        {/* Footer nav */}
        {!done && (
          <div className="px-7 pb-7 flex items-center justify-between gap-4">
            <button type="button"
              onClick={() => (step > 0 ? setStep((s) => s - 1) : handleClose())}
              className="flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-lg px-3 py-2 hover:bg-white/5"
            >
              <ChevronLeft size={15} />
              {step === 0 ? COPY.close[lang] : COPY.prev[lang]}
            </button>

            {step === 0 && (
              <button type="button"
                disabled={!selectedDate || !selectedSlot}
                onClick={() => setStep(1)}
                className="flex items-center gap-2 btn-premium text-sm font-bold uppercase tracking-wider px-6 py-3 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {COPY.next[lang]} <ArrowRight size={14} />
              </button>
            )}

            {step === 1 && (
              <button type="button"
                disabled={!form.name || !form.email}
                onClick={() => setStep(2)}
                className="flex items-center gap-2 btn-premium text-sm font-bold uppercase tracking-wider px-6 py-3 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {COPY.next[lang]} <ArrowRight size={14} />
              </button>
            )}

            {step === 2 && (
              <>
                {submitMutation.isError && (
                  <span className="text-xs text-red-400">
                    {lang === 'tr'
                      ? 'Hata oluştu, tekrar deneyin.'
                      : 'Error occurred, please retry.'}
                  </span>
                )}
                <button type="button"
                  onClick={() => submitMutation.mutate()}
                  disabled={submitMutation.isPending}
                  className="flex items-center gap-2 btn-premium-gold text-sm font-bold uppercase tracking-wider px-6 py-3 rounded-xl disabled:opacity-60"
                >
                  {submitMutation.isPending ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      {lang === 'tr' ? 'Kaydediliyor...' : 'Saving...'}
                    </>
                  ) : (
                    <>
                      {COPY.confirm[lang]} <Check size={14} />
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
