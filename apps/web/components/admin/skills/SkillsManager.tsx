'use client';

import { useCallback, useEffect, useState } from 'react';

import { SkillFormModal } from '@/components/admin/skills/SkillFormModal';
import { ConfirmDialog } from '@/components/admin/ui/ConfirmDialog';
import { Field, inputClass } from '@/components/admin/ui/form';
import { Modal } from '@/components/admin/ui/Modal';
import { EmptyState, ErrorState, Skeleton } from '@/components/admin/ui/states';
import { ToastViewport, useToasts } from '@/components/admin/ui/Toast';
import { AdminApiError, adminFetch } from '@/lib/admin/client-api';
import type { Skill, SkillCategory } from '@/lib/admin/skill-types';

interface DeleteTarget {
  kind: 'category' | 'skill';
  id: string;
  label: string;
}

export function SkillsManager() {
  const [categories, setCategories] = useState<SkillCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const { toasts, push, dismiss } = useToasts();

  // Modals
  const [skillModal, setSkillModal] = useState<{ skill: Skill | null; categoryId?: string } | null>(
    null,
  );
  const [categoryModal, setCategoryModal] = useState<{ category: SkillCategory | null } | null>(
    null,
  );
  const [catName, setCatName] = useState('');
  const [catSaving, setCatSaving] = useState(false);
  const [catError, setCatError] = useState<string | null>(null);

  // Delete flow
  const [del, setDel] = useState<DeleteTarget | null>(null);
  const [forceMessage, setForceMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const cats = await adminFetch<SkillCategory[]>('/skill-categories');
      setCategories(cats);
      setExpanded((prev) => (prev.size === 0 ? new Set(cats.map((c) => c.id)) : prev));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const toggle = (id: string) =>
    setExpanded((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // --- category reorder / skill reorder ------------------------------------
  const reorderCategories = async (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= categories.length) return;
    const next = [...categories];
    [next[index], next[target]] = [next[target], next[index]];
    setCategories(next);
    try {
      await Promise.all(
        next.map((c, i) =>
          c.display_order === i
            ? null
            : adminFetch(`/skill-categories/${c.id}`, {
                method: 'PUT',
                body: JSON.stringify({ display_order: i }),
              }),
        ),
      );
      await load();
    } catch {
      push('Could not reorder categories.', 'error');
      await load();
    }
  };

  const reorderSkills = async (category: SkillCategory, index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= category.skills.length) return;
    const next = [...category.skills];
    [next[index], next[target]] = [next[target], next[index]];
    setCategories((cats) => cats.map((c) => (c.id === category.id ? { ...c, skills: next } : c)));
    try {
      await Promise.all(
        next.map((s, i) =>
          s.display_order === i
            ? null
            : adminFetch(`/skills/${s.id}`, {
                method: 'PUT',
                body: JSON.stringify({ display_order: i }),
              }),
        ),
      );
      await load();
    } catch {
      push('Could not reorder skills.', 'error');
      await load();
    }
  };

  // --- category create / edit ----------------------------------------------
  const openCategoryModal = (category: SkillCategory | null) => {
    setCatName(category?.name ?? '');
    setCatError(null);
    setCategoryModal({ category });
  };

  const saveCategory = async () => {
    if (!categoryModal) return;
    setCatSaving(true);
    setCatError(null);
    try {
      const body = JSON.stringify({ name: catName.trim() });
      if (categoryModal.category) {
        await adminFetch(`/skill-categories/${categoryModal.category.id}`, { method: 'PUT', body });
      } else {
        await adminFetch('/skill-categories', { method: 'POST', body });
      }
      setCategoryModal(null);
      await load();
    } catch (e) {
      setCatError(e instanceof AdminApiError ? e.body.message : 'Save failed.');
    } finally {
      setCatSaving(false);
    }
  };

  // --- delete flow ----------------------------------------------------------
  const confirmDelete = async () => {
    if (!del) return;
    setBusy(true);
    try {
      if (del.kind === 'category') {
        await adminFetch(`/skill-categories/${del.id}`, { method: 'DELETE' });
        push(`Deleted category "${del.label}".`, 'success');
        setDel(null);
        await load();
      } else {
        await adminFetch(`/skills/${del.id}`, { method: 'DELETE' });
        push(`Deleted skill "${del.label}".`, 'success');
        setDel(null);
        await load();
      }
    } catch (e) {
      if (del.kind === 'skill' && e instanceof AdminApiError) {
        // Referenced by projects — offer a forced delete.
        setForceMessage(e.body.message);
      } else {
        push(e instanceof AdminApiError ? e.body.message : 'Delete failed.', 'error');
        setDel(null);
      }
    } finally {
      setBusy(false);
    }
  };

  const confirmForceDelete = async () => {
    if (!del) return;
    setBusy(true);
    try {
      await adminFetch(`/skills/${del.id}?force=true`, { method: 'DELETE' });
      push(`Deleted skill "${del.label}".`, 'success');
      setForceMessage(null);
      setDel(null);
      await load();
    } catch (e) {
      push(e instanceof AdminApiError ? e.body.message : 'Delete failed.', 'error');
      setForceMessage(null);
      setDel(null);
    } finally {
      setBusy(false);
    }
  };

  const iconBtn = 'rounded px-1.5 py-1 text-gray-400 hover:bg-gray-100 disabled:opacity-30';

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={() => openCategoryModal(null)}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          + Category
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
        </div>
      ) : error ? (
        <ErrorState onRetry={load} />
      ) : categories.length === 0 ? (
        <EmptyState
          title="No skill categories yet"
          description="Create a category, then add skills to it."
          action={
            <button
              type="button"
              onClick={() => openCategoryModal(null)}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              + Category
            </button>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {categories.map((cat, ci) => {
            const isOpen = expanded.has(cat.id);
            return (
              <div
                key={cat.id}
                className="overflow-hidden rounded-xl border border-gray-200 bg-white"
              >
                <div className="flex items-center justify-between gap-2 px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggle(cat.id)}
                    aria-expanded={isOpen}
                    className="flex items-center gap-2 text-left font-medium text-gray-900"
                  >
                    <span className="text-gray-400">{isOpen ? '▼' : '▶'}</span>
                    {cat.name}
                    <span className="text-xs font-normal text-gray-400">({cat.skills.length})</span>
                  </button>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      aria-label={`Move ${cat.name} up`}
                      className={iconBtn}
                      disabled={ci === 0}
                      onClick={() => reorderCategories(ci, -1)}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      aria-label={`Move ${cat.name} down`}
                      className={iconBtn}
                      disabled={ci === categories.length - 1}
                      onClick={() => reorderCategories(ci, 1)}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => setSkillModal({ skill: null, categoryId: cat.id })}
                      className="rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
                    >
                      + Skill
                    </button>
                    <button
                      type="button"
                      onClick={() => openCategoryModal(cat)}
                      className="rounded-md px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setDel({ kind: 'category', id: cat.id, label: cat.name })}
                      className="rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {isOpen ? (
                  <ul className="divide-y divide-gray-50 border-t border-gray-100">
                    {cat.skills.length === 0 ? (
                      <li className="px-4 py-3 text-sm text-gray-400">
                        No skills in this category yet.
                      </li>
                    ) : (
                      cat.skills.map((skill, si) => (
                        <li
                          key={skill.id}
                          className="flex items-center justify-between gap-2 px-4 py-2"
                        >
                          <span className="flex items-center gap-2 text-sm text-gray-700">
                            {skill.name}
                            {skill.featured ? (
                              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                                ★
                              </span>
                            ) : null}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              aria-label={`Move ${skill.name} up`}
                              className={iconBtn}
                              disabled={si === 0}
                              onClick={() => reorderSkills(cat, si, -1)}
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              aria-label={`Move ${skill.name} down`}
                              className={iconBtn}
                              disabled={si === cat.skills.length - 1}
                              onClick={() => reorderSkills(cat, si, 1)}
                            >
                              ↓
                            </button>
                            <button
                              type="button"
                              onClick={() => setSkillModal({ skill })}
                              className="rounded-md px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setDel({ kind: 'skill', id: skill.id, label: skill.name })
                              }
                              className="rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                            >
                              Delete
                            </button>
                          </div>
                        </li>
                      ))
                    )}
                  </ul>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      {/* Skill create/edit */}
      <SkillFormModal
        open={Boolean(skillModal)}
        skill={skillModal?.skill ?? null}
        categories={categories}
        defaultCategoryId={skillModal?.categoryId}
        onClose={() => setSkillModal(null)}
        onSaved={() => void load()}
      />

      {/* Category create/edit */}
      <Modal
        open={Boolean(categoryModal)}
        title={categoryModal?.category ? 'Edit category' : 'New category'}
        onClose={() => setCategoryModal(null)}
      >
        <div className="flex flex-col gap-3">
          <Field label="Name" required>
            <input
              className={inputClass}
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              autoFocus
            />
          </Field>
          {catError ? <p className="text-sm text-red-600">{catError}</p> : null}
          <div className="mt-1 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setCategoryModal(null)}
              className="rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveCategory}
              disabled={catSaving || !catName.trim()}
              className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {catSaving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        open={Boolean(del) && !forceMessage}
        title={del?.kind === 'category' ? 'Delete this category?' : 'Delete this skill?'}
        confirmLabel="Delete"
        destructive
        busy={busy}
        onCancel={() => (busy ? undefined : setDel(null))}
        onConfirm={() => void confirmDelete()}
      >
        {del?.kind === 'category' ? (
          <p>
            Deleting <strong>{del?.label}</strong> also removes all of its skills.
          </p>
        ) : (
          <p>
            Remove the skill <strong>{del?.label}</strong>.
          </p>
        )}
      </ConfirmDialog>

      {/* Forced-delete confirm (skill referenced by projects) */}
      <ConfirmDialog
        open={Boolean(forceMessage)}
        title="Skill is in use"
        confirmLabel="Delete anyway"
        destructive
        busy={busy}
        onCancel={() => (busy ? undefined : (setForceMessage(null), setDel(null)))}
        onConfirm={() => void confirmForceDelete()}
      >
        <p>{forceMessage}</p>
      </ConfirmDialog>

      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
