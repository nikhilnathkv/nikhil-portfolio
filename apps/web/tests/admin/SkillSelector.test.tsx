import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { SkillSelector } from '@/components/admin/projects/SkillSelector';
import type { Skill } from '@/lib/admin/project-types';

const skill = (id: string, name: string): Skill => ({
  id,
  category_id: 'c1',
  name,
  display_order: 0,
  featured: false,
});

const AVAILABLE = [skill('1', 'Python'), skill('2', 'FastAPI'), skill('3', 'LangGraph')];

describe('SkillSelector', () => {
  it('filters and adds a skill', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<SkillSelector available={AVAILABLE} selected={[]} onChange={onChange} />);

    await user.type(screen.getByLabelText('Search technologies'), 'fast');
    await user.click(screen.getByRole('option', { name: 'FastAPI' }));
    expect(onChange).toHaveBeenCalledWith([AVAILABLE[1]]);
  });

  it('renders selected chips and removes one', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<SkillSelector available={AVAILABLE} selected={[AVAILABLE[0]]} onChange={onChange} />);
    expect(screen.getByText('Python')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Remove Python' }));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('does not offer already-selected skills', async () => {
    const user = userEvent.setup();
    render(<SkillSelector available={AVAILABLE} selected={[AVAILABLE[0]]} onChange={() => {}} />);
    await user.type(screen.getByLabelText('Search technologies'), 'py');
    expect(screen.queryByRole('option', { name: 'Python' })).not.toBeInTheDocument();
  });
});
