import { PageHeader } from '@/components/admin/PageHeader';

function titleFromSegments(segments: string[]): string {
  const first = segments[0] ?? 'Section';
  return first.charAt(0).toUpperCase() + first.slice(1);
}

export default async function ComingSoonPage({
  params,
}: {
  params: Promise<{ section: string[] }>;
}) {
  const { section } = await params;
  const title = titleFromSegments(section);

  return (
    <>
      <PageHeader title={title} />
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
        <p className="text-sm font-medium text-gray-700">This section is coming soon</p>
        <p className="mt-1 max-w-sm text-sm text-gray-500">
          The {title} module will be built in an upcoming milestone. The admin shell and
          authentication are in place now.
        </p>
      </div>
    </>
  );
}
