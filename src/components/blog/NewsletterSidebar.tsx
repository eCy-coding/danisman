import React, { useState } from 'react';
import { Mail } from 'lucide-react';

export function NewsletterSidebar() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setSubmitted(true);
  };

  return (
    <aside
      data-testid="newsletter-sidebar"
      className="rounded-2xl bg-white/5 border border-white/10 p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <Mail className="w-4 h-4 text-amber-400" />
        <p className="text-sm uppercase tracking-widest text-amber-400 font-medium">
          Founder Letter
        </p>
      </div>

      <h3 className="text-lg font-bold text-white mb-2">Haftalık İçgörüler</h3>
      <p className="text-sm text-slate-400 mb-6 leading-relaxed">
        Emre Can Yalçın'ın strateji, M&A ve liderlik üzerine haftalık notları. Reklam yok, sadece
        içerik.
      </p>

      {!submitted ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="eposta@firma.com"
            required
            aria-label="E-posta adresiniz"
            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-amber-500/50"
          />
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral font-bold text-sm transition-colors"
          >
            Abone Ol
          </button>
        </form>
      ) : (
        <p className="text-sm text-amber-400 font-medium">
          Teşekkürler! İlk sayıyı yakında alacaksınız.
        </p>
      )}

      <p className="mt-4 text-xs text-slate-500 leading-relaxed">
        KVKK kapsamında verileriniz korunur. İstediğiniz zaman abonelikten çıkabilirsiniz.
        <br />
        <span className="text-slate-400">Gizlilik Politikası</span> geçerlidir.
      </p>
    </aside>
  );
}
