import React, { useState, useCallback } from 'react';
import { X, Calendar, Clock, ChevronLeft, ChevronRight, Check, ArrowRight, User, Mail, Building2, MessageSquare } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

type Lang = 'tr' | 'en';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const COPY = {
  title: { tr: 'Keşif Görüşmesi Planla', en: 'Book Discovery Call' },
  subtitle: { tr: '30 dakikalık ücretsiz stratejik danışmanlık görüşmesi', en: '30-minute complimentary strategic advisory session' },
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
  confirmedDesc: { tr: 'Onay e-postası kısa süre içinde ulaşacak.', en: 'A confirmation email will arrive shortly.' },
  close: { tr: 'Kapat', en: 'Close' },
  duration: { tr: '30 dk · Ücretsiz', en: '30 min · Free' },
  timezone: { tr: 'Avrupa/İstanbul (UTC+3)', en: 'Europe/Istanbul (UTC+3)' },
};

const TIME_SLOTS = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

const MONTHS = {
  tr: ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'],
  en: ['January','February','March','April','May','June','July','August','September','October','November','December'],
};
const DAYS = {
  tr: ['Paz','Pzt','Sal','Çar','Per','Cum','Cmt'],
  en: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
};

export const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose }) => {
  const { i18n } = useTranslation();
  const lang = ((i18n.language || 'en').startsWith('tr') ? 'tr' : 'en') as Lang;

  const today = new Date();
  const [step, setStep] = useState(0);
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', email: '', company: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleClose = useCallback(() => {
    onClose();
    setTimeout(() => { setStep(0); setSelectedDate(null); setSelectedTime(null); setForm({ name: '', email: '', company: '', message: '' }); setDone(false); }, 300);
  }, [onClose]);

  const prevMonth = () => {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
    else setCalMonth(m => m - 1);
    setSelectedDate(null);
    setSelectedTime(null);
  };

  const nextMonth = () => {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
    else setCalMonth(m => m + 1);
    setSelectedDate(null);
    setSelectedTime(null);
  };

  const isPastDay = (day: number) => {
    const d = new Date(calYear, calMonth, day);
    d.setHours(0, 0, 0, 0);
    const t = new Date(); t.setHours(0, 0, 0, 0);
    return d < t;
  };

  const isWeekend = (day: number) => {
    const dow = new Date(calYear, calMonth, day).getDay();
    return dow === 0 || dow === 6;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 900));
    setSubmitting(false);
    setDone(true);
  };

  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDay = getFirstDayOfMonth(calYear, calMonth);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={COPY.title[lang]}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={handleClose} aria-hidden="true" />

      {/* Panel */}
      <div className="relative bg-[#0a0f1c] border border-white/10 rounded-2xl shadow-[0_25px_80px_-10px_rgba(0,0,0,0.8)] w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between px-7 pt-7 pb-5 border-b border-white/5">
          <div>
            <h2 className="text-xl font-bold text-white">{COPY.title[lang]}</h2>
            <p className="text-sm text-slate-400 mt-1">{COPY.subtitle[lang]}</p>
            <div className="flex items-center gap-4 mt-3">
              <span className="flex items-center gap-1.5 text-xs text-slate-500"><Clock size={12} />{COPY.duration[lang]}</span>
              <span className="flex items-center gap-1.5 text-xs text-slate-500"><Calendar size={12} />{COPY.timezone[lang]}</span>
            </div>
          </div>
          <button onClick={handleClose} className="text-slate-500 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5 -mr-1 -mt-1 outline-none focus-visible:ring-2 focus-visible:ring-primary/50" aria-label={COPY.close[lang]}>
            <X size={20} />
          </button>
        </div>

        {/* Step indicator */}
        {!done && (
          <div className="flex items-center gap-2 px-7 py-4 border-b border-white/5">
            {[COPY.step1[lang], COPY.step2[lang], COPY.step3[lang]].map((label, i) => (
              <React.Fragment key={i}>
                <div className={`flex items-center gap-2 text-xs font-semibold transition-colors ${i === step ? 'text-primary' : i < step ? 'text-secondary' : 'text-slate-600'}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all ${i === step ? 'bg-primary border-primary text-white' : i < step ? 'bg-secondary/20 border-secondary text-secondary' : 'border-white/10 text-slate-600'}`}>
                    {i < step ? <Check size={10} /> : i + 1}
                  </span>
                  <span className="hidden sm:block">{label}</span>
                </div>
                {i < 2 && <div className={`flex-1 h-px transition-colors ${i < step ? 'bg-secondary/40' : 'bg-white/5'}`} />}
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
                <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/50"><ChevronLeft size={16} /></button>
                <span className="text-sm font-bold text-white">{MONTHS[lang][calMonth]} {calYear}</span>
                <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/50"><ChevronRight size={16} /></button>
              </div>
              {/* Day headers */}
              <div className="grid grid-cols-7 mb-2">
                {DAYS[lang].map(d => <div key={d} className="text-center text-[10px] font-bold text-slate-600 uppercase py-1">{d}</div>)}
              </div>
              {/* Days grid */}
              <div className="grid grid-cols-7 gap-1 mb-6">
                {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                  const disabled = isPastDay(day) || isWeekend(day);
                  const selected = selectedDate === day;
                  return (
                    <button
                      key={day}
                      disabled={disabled}
                      onClick={() => { setSelectedDate(day); setSelectedTime(null); }}
                      className={`aspect-square rounded-lg text-sm font-medium transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
                        disabled ? 'text-slate-700 cursor-not-allowed' :
                        selected ? 'bg-primary text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]' :
                        'text-slate-300 hover:bg-white/8 hover:text-white'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
              {/* Time slots */}
              {selectedDate !== null && (
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">{lang === 'tr' ? 'Uygun Saatler' : 'Available Times'}</p>
                  <div className="grid grid-cols-4 gap-2">
                    {TIME_SLOTS.map(t => (
                      <button
                        key={t}
                        onClick={() => setSelectedTime(t)}
                        className={`py-2 rounded-lg text-sm font-semibold transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
                          selectedTime === t ? 'bg-primary text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]' : 'bg-white/5 border border-white/8 text-slate-300 hover:bg-white/10 hover:text-white hover:border-white/20'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 1: Form */}
          {step === 1 && !done && (
            <div className="space-y-4">
              {[
                { key: 'name', label: COPY.name[lang], icon: <User size={14} />, type: 'text', required: true },
                { key: 'email', label: COPY.email[lang], icon: <Mail size={14} />, type: 'email', required: true },
                { key: 'company', label: COPY.company[lang], icon: <Building2 size={14} />, type: 'text', required: false },
              ].map(({ key, label, icon, type, required }) => (
                <div key={key}>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-1.5">
                    {icon}{label}{required && <span className="text-red-400">*</span>}
                  </label>
                  <input
                    type={type}
                    value={form[key as keyof typeof form]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    required={required}
                    className="w-full bg-white/4 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none focus:border-primary/50 focus:bg-white/6 transition-all"
                    placeholder={label}
                  />
                </div>
              ))}
              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-1.5"><MessageSquare size={14} />{COPY.message[lang]}</label>
                <textarea
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  rows={3}
                  className="w-full bg-white/4 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none focus:border-primary/50 focus:bg-white/6 transition-all resize-none"
                  placeholder={lang === 'tr' ? 'Görüşmek istediğiniz konular...' : 'Topics you want to discuss...'}
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
                    {MONTHS[lang][calMonth]} {selectedDate}, {calYear} — {selectedTime}
                  </span>
                </div>
                {form.name && <div className="flex items-center gap-3"><User size={16} className="text-slate-500 shrink-0" /><span className="text-sm text-slate-300">{form.name}</span></div>}
                {form.email && <div className="flex items-center gap-3"><Mail size={16} className="text-slate-500 shrink-0" /><span className="text-sm text-slate-300">{form.email}</span></div>}
                {form.company && <div className="flex items-center gap-3"><Building2 size={16} className="text-slate-500 shrink-0" /><span className="text-sm text-slate-300">{form.company}</span></div>}
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
              <p className="text-slate-400 text-sm mb-1">{MONTHS[lang][calMonth]} {selectedDate}, {calYear} · {selectedTime}</p>
              <p className="text-slate-500 text-sm">{COPY.confirmedDesc[lang]}</p>
              <button onClick={handleClose} className="mt-7 btn-premium-gold px-8 py-3 rounded-xl font-bold text-sm uppercase tracking-widest">
                {COPY.close[lang]}
              </button>
            </div>
          )}
        </div>

        {/* Footer nav */}
        {!done && (
          <div className="px-7 pb-7 flex items-center justify-between gap-4">
            <button
              onClick={() => step > 0 ? setStep(s => s - 1) : handleClose()}
              className="flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-lg px-3 py-2 hover:bg-white/5"
            >
              <ChevronLeft size={15} />
              {step === 0 ? COPY.close[lang] : COPY.prev[lang]}
            </button>

            {step === 0 && (
              <button
                disabled={!selectedDate || !selectedTime}
                onClick={() => setStep(1)}
                className="flex items-center gap-2 btn-premium text-sm font-bold uppercase tracking-wider px-6 py-3 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {COPY.next[lang]} <ArrowRight size={14} />
              </button>
            )}

            {step === 1 && (
              <button
                disabled={!form.name || !form.email}
                onClick={() => setStep(2)}
                className="flex items-center gap-2 btn-premium text-sm font-bold uppercase tracking-wider px-6 py-3 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {COPY.next[lang]} <ArrowRight size={14} />
              </button>
            )}

            {step === 2 && (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center gap-2 btn-premium-gold text-sm font-bold uppercase tracking-wider px-6 py-3 rounded-xl disabled:opacity-60"
              >
                {submitting ? (lang === 'tr' ? 'Kaydediliyor...' : 'Saving...') : (<>{COPY.confirm[lang]} <Check size={14} /></>)}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
