import type { Metadata } from 'next';
import { Suspense } from 'react';

import { MessagesClient } from '@/components/admin/messages/MessagesClient';
import { PageHeader } from '@/components/admin/PageHeader';

export const metadata: Metadata = { title: 'Messages' };

export default function MessagesPage() {
  return (
    <>
      <PageHeader title="Messages" description="Your contact inbox." />
      <Suspense fallback={null}>
        <MessagesClient />
      </Suspense>
    </>
  );
}
