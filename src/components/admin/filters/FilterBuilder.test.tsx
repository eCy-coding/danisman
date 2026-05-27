/**
 * M7 — Advanced Filters tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React, { useState } from 'react';
import { FilterBuilder } from './FilterBuilder';
import { TextFilter } from './TextFilter';
import { SelectFilter } from './SelectFilter';
import { DateRangeFilter } from './DateRangeFilter';
import { MultiSelectFilter } from './MultiSelectFilter';

const OPTIONS = [
  { value: 'NEW', label: 'Yeni' },
  { value: 'WON', label: 'Kazanıldı' },
];

describe('M7 — Advanced Filters', () => {
  it('TextFilter calls onChange on input', () => {
    const onChange = vi.fn();
    render(<TextFilter value="" onChange={onChange} placeholder="Ara..." />);
    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'test' } });
    expect(onChange).toHaveBeenCalledWith('test');
  });

  it('SelectFilter calls onChange on selection', () => {
    const onChange = vi.fn();
    render(<SelectFilter value="" onChange={onChange} options={OPTIONS} label="Durum" />);
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'NEW' } });
    expect(onChange).toHaveBeenCalledWith('NEW');
  });

  it('DateRangeFilter calls onChange with from/to', () => {
    const onChange = vi.fn();
    render(
      <DateRangeFilter
        value={{ from: '', to: '' }}
        onChange={onChange}
        fromLabel="Başlangıç"
        toLabel="Bitiş"
      />,
    );
    const from = screen.getByLabelText('Başlangıç');
    fireEvent.change(from, { target: { value: '2026-01-01' } });
    expect(onChange).toHaveBeenCalledWith({ from: '2026-01-01', to: '' });
  });

  it('FilterBuilder shows clear button when activeCount > 0', () => {
    const onClear = vi.fn();
    render(
      <FilterBuilder activeCount={3} onClearAll={onClear}>
        <span>filter</span>
      </FilterBuilder>,
    );
    const clearBtn = screen.getByRole('button', { name: /temizle/i });
    fireEvent.click(clearBtn);
    expect(onClear).toHaveBeenCalledOnce();
  });

  it('MultiSelectFilter toggles values and shows count', () => {
    const Wrapper = () => {
      const [val, setVal] = useState<string[]>([]);
      return (
        <MultiSelectFilter value={val} onChange={setVal} options={OPTIONS} label="Çoklu seçim" />
      );
    };
    render(<Wrapper />);
    fireEvent.click(screen.getByRole('button', { name: 'Çoklu seçim' }));
    const options = screen.getAllByRole('option');
    expect(options.length).toBe(2);
    fireEvent.click(options[0]);
    // After selecting one: count badge appears
    expect(screen.getByText('1 seçili')).toBeDefined();
  });
});
