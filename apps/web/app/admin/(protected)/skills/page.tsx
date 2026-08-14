import type { Metadata } from 'next';

import { SkillsManager } from '@/components/admin/skills/SkillsManager';
import { PageHeader } from '@/components/admin/PageHeader';

export const metadata: Metadata = { title: 'Skills' };

export default function SkillsPage() {
  return (
    <>
      <PageHeader title="Skills" description="Group your technologies into categories." />
      <SkillsManager />
    </>
  );
}
