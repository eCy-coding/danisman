/**
 * M5 — VirtualTable tests
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { VirtualTable, type Column } from './VirtualTable';

// @tanstack/react-virtual uses ResizeObserver internally — already mocked in setup.

interface Row {
  id: number;
  name: string;
}

const COLUMNS: Column<Row>[] = [
  { key: 'id', header: 'ID', render: (r) => r.id },
  { key: 'name', header: 'Name', render: (r) => r.name },
];

const makeRows = (n: number): Row[] =>
  Array.from({ length: n }, (_, i) => ({ id: i + 1, name: `Row ${i + 1}` }));

describe('M5 — VirtualTable', () => {
  it('renders all rows non-virtually when below threshold (<100)', () => {
    const rows = makeRows(10);
    render(
      <VirtualTable data={rows} columns={COLUMNS} getRowKey={(r) => r.id} virtualThreshold={100} />,
    );
    // All 10 rows should render
    expect(screen.getAllByRole('row').length).toBeGreaterThanOrEqual(10);
    expect(screen.getByText('Row 1')).toBeDefined();
    expect(screen.getByText('Row 10')).toBeDefined();
  });

  it('renders empty node when data is empty', () => {
    render(
      <VirtualTable data={[]} columns={COLUMNS} getRowKey={(r) => r.id} emptyNode="No records" />,
    );
    expect(screen.getByText('No records')).toBeDefined();
  });

  it('renders headers for all columns', () => {
    render(<VirtualTable data={makeRows(5)} columns={COLUMNS} getRowKey={(r) => r.id} />);
    expect(screen.getByText('ID')).toBeDefined();
    expect(screen.getByText('Name')).toBeDefined();
  });

  it('switches to virtual rendering when data >= virtualThreshold', () => {
    const rows = makeRows(100);
    render(
      <VirtualTable
        data={rows}
        columns={COLUMNS}
        getRowKey={(r) => r.id}
        virtualThreshold={100}
        containerHeight={200}
        rowHeight={40}
      />,
    );
    // Virtual scroll container exists
    expect(screen.getByTestId('virtual-table-scroll')).toBeDefined();
    // Virtual body exists
    expect(screen.getByTestId('virtual-table-body')).toBeDefined();
  });
});
