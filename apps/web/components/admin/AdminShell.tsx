'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import { LogoutButton } from '@/components/admin/LogoutButton';
import { NAV_SECTIONS } from '@/components/admin/nav';
import type { User } from '@/lib/admin/types';

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-4">
      {NAV_SECTIONS.map((section, i) => (
        <div key={section.title ?? `section-${i}`} className="flex flex-col gap-1">
          {section.title ? (
            <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-gray-400">
              {section.title}
            </p>
          ) : null}
          {section.items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? 'page' : undefined}
                className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                  active
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center gap-2 border-b border-gray-200 px-4">
        <span className="font-mono text-xs uppercase tracking-widest text-gray-400">Portfolio</span>
        <span className="text-sm font-semibold text-gray-900">CMS</span>
      </div>
      <SidebarNav onNavigate={onNavigate} />
      <div className="border-t border-gray-200 p-3">
        <LogoutButton className="w-full rounded-md px-3 py-2 text-left text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900" />
      </div>
    </div>
  );
}

export function AdminShell({ user, children }: { user: User; children: React.ReactNode }) {
  // The mobile drawer closes via each nav link's onNavigate handler.
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex min-h-dvh bg-gray-50 text-gray-900">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 border-r border-gray-200 bg-white lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      {drawerOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            aria-label="Close menu"
            className="absolute inset-0 bg-gray-900/40"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-64 border-r border-gray-200 bg-white shadow-xl">
            <SidebarContent onNavigate={() => setDrawerOpen(false)} />
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="flex h-14 items-center justify-between gap-3 border-b border-gray-200 bg-white px-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setDrawerOpen(true)}
              className="rounded-md p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
            >
              <span
                aria-hidden
                className="block h-0.5 w-5 bg-current shadow-[0_6px_0_currentColor,0_-6px_0_currentColor]"
              />
            </button>
            <span className="text-sm font-semibold tracking-tight">Nikhil Portfolio CMS</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-gray-500 sm:inline">{user.email}</span>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
              {user.email.slice(0, 1).toUpperCase()}
            </span>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
