import Link from 'next/link';

export function StatCard({
  label,
  value,
  hint,
  href,
}: {
  label: string;
  value: number | string;
  hint?: string;
  href?: string;
}) {
  const card = (
    <div
      className={`rounded-xl border border-gray-200 bg-white p-5 shadow-sm ${
        href ? 'transition hover:border-indigo-300 hover:shadow' : ''
      }`}
    >
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">{value}</p>
      {hint ? <p className="mt-1 text-xs text-gray-400">{hint}</p> : null}
    </div>
  );
  return href ? (
    <Link href={href} className="block">
      {card}
    </Link>
  ) : (
    card
  );
}
