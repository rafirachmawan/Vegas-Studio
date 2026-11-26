import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ScheduleBoard } from './ScheduleBoard';
import type { ScheduleSlot } from '../types/studio';

const SAMPLE_TWO_SLOTS: ScheduleSlot[] = [
  {
    id: 'jdw-01',
    tanggal: '2026-11-26',
    jam: 'jam 3 sore',
    status: 'Booked',
    catatan: '',
  },
  {
    id: 'jdw-02',
    tanggal: '2026-11-27',
    jam: 'jam 3 sore',
    status: 'Kosong',
    catatan: '',
  },
];

describe('ScheduleBoard modern responsive layout', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('menyeimbangkan grid menjadi 2 kolom saat hanya ada 2 slot jadwal', () => {
    const { container } = render(
      <ScheduleBoard
        slots={SAMPLE_TWO_SLOTS}
        selectedSlotId=""
        isLoading={false}
        errorMessage={null}
        onSelectSlot={vi.fn()}
        onRetry={vi.fn()}
      />,
    );

    const grid = container.querySelector('.sm\\:grid-cols-2');
    expect(grid).toBeInTheDocument();
    expect(grid?.className).not.toContain('lg:grid-cols-3');
    expect(screen.getByText('26')).toBeInTheDocument();
    expect(screen.getByText('27')).toBeInTheDocument();
  });

  it('memfilter status Kosong dan Booked serta memilih slot Kosong dengan benar', async () => {
    const onSelectSlot = vi.fn();
    render(
      <ScheduleBoard
        slots={SAMPLE_TWO_SLOTS}
        selectedSlotId=""
        isLoading={false}
        errorMessage={null}
        onSelectSlot={onSelectSlot}
        onRetry={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Kosong \(1\)/i }));
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /Booked.*2026/i })).not.toBeInTheDocument();
    });

    const kosongBtn = screen.getByRole('button', { name: /Kosong.*2026/i });
    fireEvent.click(kosongBtn);
    expect(onSelectSlot).toHaveBeenCalledWith(SAMPLE_TWO_SLOTS[1]);

    fireEvent.click(screen.getByRole('button', { name: /Booked \(1\)/i }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Booked.*2026/i })).toBeDisabled();
    });
  });
});
