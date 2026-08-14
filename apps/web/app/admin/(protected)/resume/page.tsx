import type { Metadata } from 'next';

import { ResumeManagerClient } from '@/components/admin/resume/ResumeManagerClient';
import { PageHeader } from '@/components/admin/PageHeader';

export const metadata: Metadata = { title: 'Resume' };

export default function ResumePage() {
  return (
    <>
      <PageHeader title="Resume" description="Manage your resume versions." />
      <ResumeManagerClient />
    </>
  );
}
