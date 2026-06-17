/**
 * Anti-regresyon guard (Council C): test harness'inin component'leri GERÇEKTEN
 * DOM'a render ettiğini doğrular. M4/M5'te keşfedildi: shell `NODE_ENV=production`
 * + sahte `act` polyfill'i nedeniyle React 19 + testing-library `render()` BOŞ DOM
 * üretiyordu (`<body><div/></body>`) ve 63 component testi sessizce kırılıyordu.
 * Bu trivial test, o sınıf kırılma geri gelirse ANINDA kırmızı yanar.
 * Bağımlılıksız; mock yok; sadece çıplak render.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

describe('test harness — render commit guard', () => {
  it('testing-library render() DOM\'a commit eder (boş <div/> değil)', () => {
    const { container } = render(<div data-testid="probe">harness-ok</div>);
    expect(screen.getByText('harness-ok')).toBeTruthy();
    expect(container.querySelector('[data-testid="probe"]')).toBeTruthy();
  });

  it('React.act gerçek bir fonksiyondur (dev build yüklü)', () => {
    // Prod build'te act yok / throw eder; dev build'te gerçek flush eden act var.
    expect(typeof (React as unknown as { act?: unknown }).act === 'function').toBe(true);
  });
});
