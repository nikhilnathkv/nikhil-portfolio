import type { Metadata } from 'next';

import { ProfileEditor } from '@/components/admin/profile/ProfileEditor';
import { getAdminProfile } from '@/lib/admin/server-api';

export const metadata: Metadata = { title: 'Profile' };

export default async function ProfilePage() {
  const profile = await getAdminProfile();
  return <ProfileEditor initial={profile} />;
}
