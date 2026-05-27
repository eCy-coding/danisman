import React from 'react';
import { useAdaylar } from '../../../hooks/useAdminLeads';

interface AdaySummary {
  id: string;
  name: string;
  company: string;
  status: string;
}

export function LeadListTable() {
  const { data, isLoading, fetchNextPage, hasNextPage } = useAdaylar();

  if (isLoading) {
    return (
      <div role="status" aria-label="Yükleniyor">
        Yükleniyor…
      </div>
    );
  }

  const rows: AdaySummary[] =
    data?.pages.flatMap(
      (page) => (page as { data?: { results?: AdaySummary[] } }).data?.results ?? [],
    ) ?? [];

  return (
    <div>
      <table>
        <thead>
          <tr>
            <th>Ad Soyad</th>
            <th>Şirket</th>
            <th>Durum</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((aday) => (
            <tr key={aday.id}>
              <td>{aday.name}</td>
              <td>{aday.company}</td>
              <td>{aday.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {hasNextPage && (
        <button type="button" onClick={() => void fetchNextPage()}>
          Daha Fazla Yükle
        </button>
      )}
    </div>
  );
}
