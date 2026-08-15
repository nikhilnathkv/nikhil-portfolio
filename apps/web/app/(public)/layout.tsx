import type { ReactNode } from 'react';

import { Footer, PublicNav, SkipToContent, type SocialLink } from '@/components/public';
import { getProfile } from '@/services/profile';

/**
 * Public site shell (M4.1). Applies the committed dark "technical" theme via the
 * `.public-theme` wrapper (scoped so the admin keeps its light theme), then the
 * skip link, sticky nav, <main> landmark, and footer that every public page
 * inherits. Site identity + social links come from the public profile.
 */
export default async function PublicLayout({ children }: { children: ReactNode }) {
  const profile = await getProfile();
  const siteName = profile?.name?.trim() || 'Nikhil Nath';

  const socials: SocialLink[] = [
    profile?.github_url ? { label: 'GitHub', href: profile.github_url } : null,
    profile?.linkedin_url ? { label: 'LinkedIn', href: profile.linkedin_url } : null,
    profile?.email ? { label: 'Email', href: `mailto:${profile.email}` } : null,
  ].filter((s): s is SocialLink => s !== null);

  return (
    <div className="public-theme flex min-h-dvh flex-col bg-pub-bg text-pub-fg">
      <SkipToContent />
      <div className="no-print">
        <PublicNav siteName={siteName} />
      </div>
      <main id="content" className="flex-1">
        {children}
      </main>
      <div className="no-print">
        <Footer siteName={siteName} socials={socials} />
      </div>
    </div>
  );
}
