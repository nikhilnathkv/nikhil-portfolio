'use client';

import { useEffect, useMemo, useState } from 'react';

import { Field, inputClass, Section } from '@/components/admin/ui/form';
import { ErrorState, Skeleton } from '@/components/admin/ui/states';
import { ToastViewport, useToasts } from '@/components/admin/ui/Toast';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { AdminApiError, adminFetch } from '@/lib/admin/client-api';
import { ALL_SETTING_KEYS, SETTING_GROUPS } from '@/lib/admin/settings';

interface SiteSetting {
  key: string;
  value: string | null;
}

export function SettingsForm() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toasts, push, dismiss } = useToasts();

  // `reloadKey` triggers a re-fetch (retry button). The effect below is
  // Strict-Mode safe: an `active` flag ensures a duplicate/late load never
  // clobbers values the user has since edited.
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    void (async () => {
      if (active) setError(false);
      try {
        const settings = await adminFetch<SiteSetting[]>('/settings');
        if (!active) return;
        const map: Record<string, string> = {};
        for (const key of ALL_SETTING_KEYS) map[key] = '';
        for (const s of settings) if (ALL_SETTING_KEYS.includes(s.key)) map[s.key] = s.value ?? '';
        setValues(map);
        setSaved(map);
      } catch {
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [reloadKey]);

  const load = () => {
    setLoading(true);
    setReloadKey((k) => k + 1);
  };

  const isDirty = useMemo(() => JSON.stringify(values) !== JSON.stringify(saved), [values, saved]);
  useUnsavedChanges(isDirty);

  const set = (key: string, value: string) => setValues((v) => ({ ...v, [key]: value }));

  const save = async () => {
    setSaving(true);
    const changed = ALL_SETTING_KEYS.filter((k) => values[k] !== saved[k]);
    try {
      await Promise.all(
        changed.map((k) =>
          adminFetch(`/settings/${k}`, {
            method: 'PUT',
            body: JSON.stringify({ value: values[k] || null }),
          }),
        ),
      );
      setSaved(values);
      push('Settings saved.', 'success');
    } catch (e) {
      push(e instanceof AdminApiError ? e.body.message : 'Save failed.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
    );
  if (error) return <ErrorState onRetry={load} />;

  return (
    <div className="pb-16">
      <div className="sticky top-0 z-30 -mx-4 mb-6 flex items-center justify-between gap-3 border-b border-gray-200 bg-gray-50/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-gray-900">Site settings</h1>
          {isDirty ? <span className="text-xs font-medium text-amber-600">Unsaved</span> : null}
        </div>
        <button
          type="button"
          onClick={save}
          disabled={saving || !isDirty}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        {SETTING_GROUPS.map((group) => (
          <Section key={group.title} title={group.title}>
            {group.fields.map((f) => (
              <Field key={f.key} label={f.label}>
                {f.multiline ? (
                  <textarea
                    className={inputClass}
                    rows={2}
                    value={values[f.key] ?? ''}
                    onChange={(e) => set(f.key, e.target.value)}
                    placeholder={f.placeholder}
                  />
                ) : (
                  <input
                    className={inputClass}
                    value={values[f.key] ?? ''}
                    onChange={(e) => set(f.key, e.target.value)}
                    placeholder={f.placeholder}
                  />
                )}
              </Field>
            ))}
          </Section>
        ))}
      </div>

      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
