import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ProjectView } from '@/components/projects/ProjectView';
import { Container } from '@/components/public';
import { getPublishedProject } from '@/services/projects';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await getPublishedProject(slug);
  if (!project) return { title: 'Project not found' };
  return {
    title: project.seo_title ?? project.title,
    description: project.seo_description ?? project.short_description,
  };
}

export default async function PublicProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getPublishedProject(slug);
  if (!project) notFound();

  return (
    <Container className="py-16">
      <ProjectView project={project} />
    </Container>
  );
}
