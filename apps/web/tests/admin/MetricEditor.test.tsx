import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { MetricEditor } from '@/components/admin/projects/MetricEditor';
import type { ProjectMetric } from '@/lib/admin/project-types';

describe('MetricEditor', () => {
  it('adds a metric row', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<MetricEditor metrics={[]} onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: '+ Add Metric' }));
    expect(onChange).toHaveBeenCalledWith([
      { name: '', value: '', unit: '', description: '', display_order: 0 },
    ]);
  });

  it('edits a metric field', async () => {
    const metrics: ProjectMetric[] = [
      { name: '', value: '', unit: '', description: '', display_order: 0 },
    ];
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<MetricEditor metrics={metrics} onChange={onChange} />);
    await user.type(screen.getByLabelText('Metric 1 name'), 'A');
    expect(onChange).toHaveBeenLastCalledWith([expect.objectContaining({ name: 'A' })]);
  });

  it('removes a metric row', async () => {
    const metrics: ProjectMetric[] = [
      { name: 'Accuracy', value: '94', unit: '%', description: '', display_order: 0 },
    ];
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<MetricEditor metrics={metrics} onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: 'Remove metric 1' }));
    expect(onChange).toHaveBeenCalledWith([]);
  });
});
