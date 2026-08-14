'use client';

import { useEffect, useState } from 'react';

import { Modal } from '@/components/admin/ui/Modal';
import { Field, inputClass } from '@/components/admin/ui/form';
import { AdminApiError, adminFetch } from '@/lib/admin/client-api';
import type { ProjectRef } from '@/lib/admin/experience-types';
import type { Skill, SkillCategory } from '@/lib/admin/skill-types';

export function SkillFormModal({
  open,
  skill,
  categories,
  defaultCategoryId,
  onClose,
  onSaved,
}: {
  open: boolean;
  skill: Skill | null;
  categories: SkillCategory[];
  defaultCategoryId?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  // The form body is keyed + remounted per open, so its state initializes from
  // props without a reset-in-effect.
  return (
    <Modal open={open} title={skill ? 'Edit skill' : 'New skill'} onClose={onClose}>
      {open ? (
        <SkillFormBody
          key={skill?.id ?? 'new'}
          skill={skill}
          categories={categories}
          defaultCategoryId={defaultCategoryId}
          onClose={onClose}
          onSaved={onSaved}
        />
      ) : null}
    </Modal>
  );
}

function SkillFormBody({
  skill,
  categories,
  defaultCategoryId,
  onClose,
  onSaved,
}: {
  skill: Skill | null;
  categories: SkillCategory[];
  defaultCategoryId?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = Boolean(skill);
  const [name, setName] = useState(skill?.name ?? '');
  const [categoryId, setCategoryId] = useState(
    skill?.category_id ?? defaultCategoryId ?? categories[0]?.id ?? '',
  );
  const [description, setDescription] = useState(skill?.description ?? '');
  const [featured, setFeatured] = useState(skill?.featured ?? false);
  const [displayOrder, setDisplayOrder] = useState(skill?.display_order ?? 0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<ProjectRef[] | null>(null);

  // Load the usage indicator when editing an existing skill.
  useEffect(() => {
    if (!skill) return;
    let active = true;
    adminFetch<ProjectRef[]>(`/skills/${skill.id}/projects`)
      .then((u) => active && setUsage(u))
      .catch(() => active && setUsage([]));
    return () => {
      active = false;
    };
  }, [skill]);

  const save = async () => {
    setSaving(true);
    setError(null);
    const body = JSON.stringify({
      category_id: categoryId,
      name: name.trim(),
      description: description.trim() || null,
      featured,
      display_order: displayOrder,
    });
    try {
      if (isEdit) {
        await adminFetch(`/skills/${skill!.id}`, { method: 'PUT', body });
      } else {
        await adminFetch('/skills', { method: 'POST', body });
      }
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof AdminApiError ? e.body.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <Field label="Name" required>
        <input
          className={inputClass}
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
      </Field>
      <Field label="Category" required>
        <select
          className={inputClass}
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Description">
        <textarea
          className={inputClass}
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </Field>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <input
            type="checkbox"
            checked={featured}
            onChange={(e) => setFeatured(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          Featured
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          Order
          <input
            type="number"
            className="w-20 rounded-md border border-gray-300 px-2 py-1 text-sm"
            value={displayOrder}
            onChange={(e) => setDisplayOrder(Number(e.target.value) || 0)}
          />
        </label>
      </div>

      {usage && usage.length > 0 ? (
        <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-sm">
          <p className="mb-1 font-medium text-gray-700">
            Used by {usage.length} project{usage.length === 1 ? '' : 's'}:
          </p>
          <ul className="list-inside list-disc text-gray-500">
            {usage.map((p) => (
              <li key={p.id}>{p.title}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="mt-2 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={save}
          disabled={saving || !name.trim() || !categoryId}
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
}
