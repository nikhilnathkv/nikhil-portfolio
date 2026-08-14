import type { Metadata } from 'next';

import { MediaLibraryClient } from '@/components/admin/media/MediaLibraryClient';
import { PageHeader } from '@/components/admin/PageHeader';

export const metadata: Metadata = { title: 'Media' };

export default function MediaPage() {
  return (
    <>
      <PageHeader title="Media" description="Images and documents used across your portfolio." />
      <MediaLibraryClient />
    </>
  );
}
