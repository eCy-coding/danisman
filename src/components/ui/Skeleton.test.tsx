/**
 * P23/T2 — Skeleton primitive testleri (CLS + a11y).
 */
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Skeleton, BlogCardSkeleton, TableRowSkeleton } from './Skeleton';

describe('<Skeleton>', () => {
  it('aria-busy + role=status veriyor', () => {
    const { container } = render(<Skeleton width={100} height={20} />);
    const el = container.firstChild as HTMLElement;
    expect(el.getAttribute('role')).toBe('status');
    expect(el.getAttribute('aria-busy')).toBe('true');
  });

  it('numerik genişlik px değerine çevriliyor (CLS rezerve)', () => {
    const { container } = render(<Skeleton width={42} height={24} />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.width).toBe('42px');
    expect(el.style.height).toBe('24px');
  });

  it('variant=circle rounded-full uyguluyor', () => {
    const { container } = render(<Skeleton variant="circle" width={32} height={32} />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain('rounded-full');
  });

  it('noShimmer prop shimmer class engelliyor', () => {
    const { container } = render(<Skeleton noShimmer width={40} height={20} />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).not.toContain('ecy-skeleton-shimmer');
  });
});

describe('<BlogCardSkeleton>', () => {
  it('aria-label TR localized', () => {
    const { container } = render(<BlogCardSkeleton />);
    const article = container.querySelector('article');
    expect(article?.getAttribute('aria-label')).toBe('Blog yazısı yükleniyor');
  });
});

describe('<TableRowSkeleton>', () => {
  it('cols sayısı kadar td üretiyor', () => {
    // tr-tagged element must be wrapped in a table to be valid; jsdom rendering still works.
    const { container } = render(
      <table>
        <tbody>
          <TableRowSkeleton cols={7} />
        </tbody>
      </table>,
    );
    expect(container.querySelectorAll('td').length).toBe(7);
  });
});
