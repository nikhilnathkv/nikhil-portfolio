'use client';

import type { ProjectMetric } from '@/lib/admin/project-types';

const cell =
  'w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100';

export function MetricEditor({
  metrics,
  onChange,
}: {
  metrics: ProjectMetric[];
  onChange: (next: ProjectMetric[]) => void;
}) {
  const update = (index: number, patch: Partial<ProjectMetric>) => {
    onChange(metrics.map((m, i) => (i === index ? { ...m, ...patch } : m)));
  };

  const add = () => {
    onChange([
      ...metrics,
      { name: '', value: '', unit: '', description: '', display_order: metrics.length },
    ]);
  };

  const remove = (index: number) => {
    onChange(metrics.filter((_, i) => i !== index).map((m, i) => ({ ...m, display_order: i })));
  };

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= metrics.length) return;
    const next = [...metrics];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next.map((m, i) => ({ ...m, display_order: i })));
  };

  return (
    <div>
      <p className="mb-3 text-sm text-gray-500">
        Use real, measurable outcomes — these carry weight on your resume and LinkedIn.
      </p>

      {metrics.length === 0 ? (
        <p className="rounded-md border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-400">
          No metrics yet.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-gray-400">
                <th className="pb-2 pr-2 font-semibold">Name</th>
                <th className="pb-2 pr-2 font-semibold">Value</th>
                <th className="pb-2 pr-2 font-semibold">Unit</th>
                <th className="pb-2 pr-2 font-semibold">Description</th>
                <th className="pb-2 font-semibold" />
              </tr>
            </thead>
            <tbody>
              {metrics.map((m, i) => (
                <tr key={i}>
                  <td className="py-1 pr-2 align-top">
                    <input
                      aria-label={`Metric ${i + 1} name`}
                      value={m.name}
                      onChange={(e) => update(i, { name: e.target.value })}
                      className={cell}
                      placeholder="Accuracy"
                    />
                  </td>
                  <td className="py-1 pr-2 align-top">
                    <input
                      aria-label={`Metric ${i + 1} value`}
                      value={m.value}
                      onChange={(e) => update(i, { value: e.target.value })}
                      className={cell}
                      placeholder="94.2"
                    />
                  </td>
                  <td className="py-1 pr-2 align-top">
                    <input
                      aria-label={`Metric ${i + 1} unit`}
                      value={m.unit ?? ''}
                      onChange={(e) => update(i, { unit: e.target.value })}
                      className={cell}
                      placeholder="%"
                    />
                  </td>
                  <td className="py-1 pr-2 align-top">
                    <input
                      aria-label={`Metric ${i + 1} description`}
                      value={m.description ?? ''}
                      onChange={(e) => update(i, { description: e.target.value })}
                      className={cell}
                      placeholder="Test set"
                    />
                  </td>
                  <td className="py-1 align-top">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        aria-label={`Move metric ${i + 1} up`}
                        onClick={() => move(i, -1)}
                        disabled={i === 0}
                        className="rounded px-1.5 py-1 text-gray-400 hover:bg-gray-100 disabled:opacity-30"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        aria-label={`Move metric ${i + 1} down`}
                        onClick={() => move(i, 1)}
                        disabled={i === metrics.length - 1}
                        className="rounded px-1.5 py-1 text-gray-400 hover:bg-gray-100 disabled:opacity-30"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        aria-label={`Remove metric ${i + 1}`}
                        onClick={() => remove(i)}
                        className="rounded px-1.5 py-1 text-red-500 hover:bg-red-50"
                      >
                        ✕
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <button
        type="button"
        onClick={add}
        className="mt-3 rounded-md border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:border-indigo-300 hover:text-indigo-700"
      >
        + Add Metric
      </button>
    </div>
  );
}
