/** Public site information architecture — shared by PublicNav and Footer. */
export interface NavLink {
  href: string;
  label: string;
}

export const NAV_LINKS: NavLink[] = [
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
 * Active-link test that also lights the parent for detail routes
 * (e.g. `/projects/foo` keeps "Projects" active). The home route matches exactly.
 */
export function isActivePath(current: string, href: string): boolean {
  if (href === '/') return current === '/';
  return current === href || current.startsWith(`${href}/`);
}
