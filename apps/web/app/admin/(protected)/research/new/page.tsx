import type { Metadata } from 'next';

import { ResearchEditor } from '@/components/admin/research/ResearchEditor';

export const metadata: Metadata = { title: 'New Research' };

export default function NewResearchPage() {
  return <ResearchEditor />;
}
