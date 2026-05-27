import React, { useState } from 'react';
import { useFounderLetter, type FounderLetter } from '../../hooks/useFounderLetter';

type Lang = 'tr' | 'en';

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Taslak',
  SCHEDULED: 'Zamanlandı',
  PUBLISHED: 'Yayında',
  ARCHIVED: 'Arşiv',
};

export const AdminFounderLetterPage: React.FC = () => {
  const { letters, isLoading, publishLetter, archiveLetter } = useFounderLetter();
  const [selected, setSelected] = useState<FounderLetter | null>(null);
  const [lang, setLang] = useState<Lang>('tr');

  if (isLoading)
    return (
      <div role="status" aria-live="polite">
        Yükleniyor…
      </div>
    );

  return (
    <main className="p-fib-6">
      <h1 className="text-golden-lg font-bold mb-fib-7">Founder Letter Merkezi</h1>
      <p className="text-sm opacity-60 mb-fib-8">
        Emre Can Yalçın aylık bülten yönetimi — Taslak, zamanlama, yayın, arşiv
      </p>

      <table aria-label="Founder Letter Listesi" className="w-full">
        <thead>
          <tr>
            <th className="text-left">Başlık (TR)</th>
            <th>Durum</th>
            <th>Abone</th>
            <th>Açılış</th>
            <th>İşlem</th>
          </tr>
        </thead>
        <tbody>
          {letters.map((letter) => (
            <tr key={letter.id}>
              <td>{letter.titleTr}</td>
              <td>
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-surface-600">
                  {STATUS_LABELS[letter.status] ?? letter.status}
                </span>
              </td>
              <td>{letter.subscriberCount}</td>
              <td>{letter.openRate != null ? `${Math.round(letter.openRate * 100)}%` : '-'}</td>
              <td className="flex gap-2">
                <button
                  onClick={() => setSelected(letter)}
                  aria-label={`Düzenle: ${letter.titleTr}`}
                  className="text-sm underline"
                >
                  Düzenle
                </button>
                {letter.status === 'DRAFT' && (
                  <button
                    onClick={() => void publishLetter.mutate(letter.id)}
                    aria-label={`Yayınla: ${letter.titleTr}`}
                    className="text-sm text-green-400"
                  >
                    Yayınla
                  </button>
                )}
                {letter.status === 'PUBLISHED' && (
                  <button
                    onClick={() => void archiveLetter.mutate(letter.id)}
                    aria-label={`Arşivle: ${letter.titleTr}`}
                    className="text-sm text-gray-400"
                  >
                    Arşivle
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selected && (
        <div role="dialog" aria-label={`Düzenle: ${selected.titleTr}`} className="mt-fib-8">
          <div role="tablist" aria-label="Dil seçimi" className="flex gap-2 mb-fib-6">
            {(['tr', 'en'] as Lang[]).map((l) => (
              <button
                key={l}
                role="tab"
                aria-selected={lang === l ? 'true' : 'false'}
                onClick={() => setLang(l)}
                className={`px-3 py-1 rounded ${lang === l ? 'bg-blue-600' : 'bg-surface-600'}`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>

          <label htmlFor="letter-title" className="block mb-1 text-sm">
            {lang === 'tr' ? 'Başlık (TR)' : 'Title (EN)'}
          </label>
          <input
            id="letter-title"
            defaultValue={lang === 'tr' ? selected.titleTr : selected.titleEn}
            className="w-full bg-surface-700 rounded px-3 py-2 mb-fib-6"
          />

          <label htmlFor="letter-content" className="block mb-1 text-sm">
            İçerik (Markdown)
          </label>
          <textarea
            id="letter-content"
            rows={12}
            defaultValue={lang === 'tr' ? selected.contentMdTr : selected.contentMdEn}
            className="w-full bg-surface-700 rounded px-3 py-2 font-mono text-sm"
          />

          <button
            onClick={() => setSelected(null)}
            className="mt-fib-6 px-4 py-2 rounded bg-surface-600"
          >
            Kapat
          </button>
        </div>
      )}
    </main>
  );
};
