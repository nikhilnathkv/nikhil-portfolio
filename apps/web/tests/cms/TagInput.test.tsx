import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { TagInput } from '@/components/cms/TagInput';

describe('TagInput', () => {
  it('adds a tag on Enter', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<TagInput value={[]} onChange={onChange} />);
    await user.type(screen.getByLabelText('Add tag'), 'RAG{Enter}');
    expect(onChange).toHaveBeenCalledWith(['RAG']);
  });

  it('removes a tag via its chip', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<TagInput value={['RAG', 'LLM']} onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: 'Remove RAG' }));
    expect(onChange).toHaveBeenCalledWith(['LLM']);
  });
});
