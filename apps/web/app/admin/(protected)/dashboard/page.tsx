import type { Metadata } from 'next';
import Link from 'next/link';

import { PageHeader } from '@/components/admin/PageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { getDashboardSummary } from '@/lib/admin/server-api';

export const metadata: Metadata = { title: 'Dashboard' };

const QUICK_ACTIONS = [
  { label: '+ New Project', href: '/admin/projects/new' },
  { label: '+ New Article', href: '/admin/blog/new' },
  { label: '+ New Research', href: '/admin/research/new' },
];

export default async function DashboardPage() {
  const summary = await getDashboardSummary();

  return (
    <>
      <PageHeader title="Dashboard" description="An overview of your portfolio content." />

      {summary ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Projects"
            value={summary.projects.total}
            hint={`${summary.projects.published} published · ${summary.projects.drafts} drafts`}
          />
          <StatCard
            label="Articles"
            value={summary.blog.total}
            hint={`${summary.blog.published} published · ${summary.blog.drafts} drafts`}
          />
          <StatCard label="Research" value={summary.research} hint="published + drafts" />
          <StatCard label="Unread messages" value={summary.unread_messages} hint="in your inbox" />
        </div>
      ) : (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Could not load dashboard stats. Is the API running?
        </div>
      )}

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
          Quick actions
        </h2>
        <div className="flex flex-wrap gap-3">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:border-indigo-300 hover:text-indigo-700"
            >
              {action.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
          Recent activity
        </h2>
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
          Activity tracking arrives in a later milestone.
        </div>
      </section>
    </>
  );
}
