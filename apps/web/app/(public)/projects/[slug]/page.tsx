import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { CaseStudyView } from '@/components/projects/CaseStudyView';
import { getPublishedProject } from '@/services/projects';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await getPublishedProject(slug);
  if (!project) return { title: 'Project not found' };
  const title = project.seo_title ?? project.title;
  const description = project.seo_description ?? project.short_description;
  const path = `/projects/${project.slug}`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'article',
      title,
      description,
      url: path,
      ...(project.hero_image_url ? { images: [{ url: project.hero_image_url }] } : {}),
    },
  };
}

export default async function PublicProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getPublishedProject(slug);
  if (!project) notFound();

  return <CaseStudyView project={project} />;
}
