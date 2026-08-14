/** Shared form primitives for the admin editors (Projects, Profile, Experience…). */

export const inputClass =
  'w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100';

export function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">
        {label} {required ? <span className="text-red-500">*</span> : null}
      </span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-gray-400">{hint}</span> : null}
    </label>
  );
}

export function Section({
  id,
  title,
  children,
}: {
  id?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 rounded-xl border border-gray-200 bg-white p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">{title}</h2>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}
