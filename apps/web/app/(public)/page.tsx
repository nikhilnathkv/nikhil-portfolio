import type { Metadata } from 'next';

import type { SocialLink } from '@/components/public';
import {
  AboutPreview,
  ClosingCta,
  EngineeringFocus,
  ExperiencePreview,
  Hero,
  ResearchWriting,
  SelectedWork,
} from '@/components/public/home';
import { PersonWebSiteJsonLd } from '@/components/public/JsonLd';
import { SITE } from '@/lib/site';
import { listPosts } from '@/services/blog';
import { listExperience } from '@/services/experience';
import { getProfile } from '@/services/profile';
import { listProjects } from '@/services/projects';
import { listResearch } from '@/services/research';
import { listSkills } from '@/services/skills';

export const metadata: Metadata = {
  // Home is the canonical root; give it a full (non-templated) title.
  title: {
    absolute: 'Nikhil Nath — AI/ML Engineer · GenAI, Agentic AI & ML Systems',
  },
  description:
    'AI/ML engineer building production-grade intelligent systems across GenAI, agentic AI, machine learning, and data platforms.',
  alternates: { canonical: '/' },
};

const DEFAULT_TECH = ['GenAI', 'Agentic AI', 'RAG', 'ML', 'MLOps', 'Computer Vision'];

export default async function HomePage() {
  // Single conceptual resource (the homepage) — fetch its parts in parallel.
  const [profile, featuredProjects, experience, writing, research, skills] = await Promise.all([
    getProfile(),
    listProjects({ featured: true }),
    listExperience(),
    listPosts(),
    listResearch(),
    listSkills(),
  ]);

  const name = profile?.name?.trim() || SITE.name;
  const role = profile?.headline?.trim() || 'AI / ML Engineer';
  const positioning =
    profile?.short_bio?.trim() ||
    'I build production-grade AI systems across GenAI, agentic AI, machine learning, and intelligent data platforms.';
  const about =
    profile?.long_bio?.trim() ||
    profile?.short_bio?.trim() ||
    'I’m an AI/ML engineer focused on building production-grade intelligent systems — spanning machine learning, GenAI, agentic systems, data platforms, and computer vision.';

  // Tech signal from featured skills, falling back to a curated set.
  const featuredSkills = skills
    .flatMap((c) => c.skills)
    .filter((s) => s.featured)
    .map((s) => s.name);
  const techSignal = (featuredSkills.length > 0 ? featuredSkills : DEFAULT_TECH).slice(0, 8);

  const socials: SocialLink[] = [
    profile?.github_url ? { label: 'GitHub', href: profile.github_url } : null,
    profile?.linkedin_url ? { label: 'LinkedIn', href: profile.linkedin_url } : null,
    profile?.email ? { label: 'Email', href: `mailto:${profile.email}` } : null,
  ].filter((s): s is SocialLink => s !== null);

  return (
    <>
      <PersonWebSiteJsonLd
        name={name}
        role={role}
        sameAs={socials.filter((s) => s.href.startsWith('http')).map((s) => s.href)}
      />
      <Hero name={name} role={role} positioning={positioning} techSignal={techSignal} />
      <SelectedWork projects={featuredProjects} githubUrl={profile?.github_url} />
      <EngineeringFocus categories={skills} />
      <ExperiencePreview experience={experience} />
      <ResearchWriting research={research} writing={writing} />
      <AboutPreview bio={about} />
      <ClosingCta socials={socials} />
    </>
  );
}
