/** Public site information architecture — shared by PublicNav and Footer. */
export interface NavLink {
  href: string;
  label: string;
}

/** Every public section, in menu order. */
export const ALL_NAV_LINKS: NavLink[] = [
  { href: '/projects', label: 'Projects' },
  { href: '/writing', label: 'Writing' },
  { href: '/research', label: 'Research' },
  { href: '/experiments', label: 'Experiments' },
  { href: '/experience', label: 'Experience' },
  { href: '/about', label: 'About' },
  { href: '/resume', label: 'Resume' },
  { href: '/contact', label: 'Contact' },
];

/**
 * Sections kept out of the header and footer until they have published
 * content, so visitors don't land on "coming soon" pages. The pages still
 * exist and work by direct URL. Remove an href here once its section has
 * at least one published entry.
 */
export const HIDDEN_NAV_HREFS: ReadonlySet<string> = new Set([
  '/projects',
  '/writing',
  '/research',
  '/experiments',
  '/experience',
]);

/** The links shown in the header and footer. */
export const NAV_LINKS: NavLink[] = ALL_NAV_LINKS.filter(
  (link) => !HIDDEN_NAV_HREFS.has(link.href),
);

/**
 * Active-link test that also lights the parent for detail routes
 * (e.g. `/projects/foo` keeps "Projects" active). The home route matches exactly.
 */
export function isActivePath(current: string, href: string): boolean {
  if (href === '/') return current === '/';
  return current === href || current.startsWith(`${href}/`);
}
