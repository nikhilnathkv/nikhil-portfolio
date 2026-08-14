export interface NavItem {
  label: string;
  href: string;
}

export interface NavSection {
  title: string | null;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    title: null,
    items: [{ label: 'Dashboard', href: '/admin/dashboard' }],
  },
  {
    title: 'Content',
    items: [
      { label: 'Projects', href: '/admin/projects' },
      { label: 'Experience', href: '/admin/experience' },
      { label: 'Blog', href: '/admin/blog' },
      { label: 'Research', href: '/admin/research' },
      { label: 'Experiments', href: '/admin/experiments' },
    ],
  },
  {
    title: 'Portfolio',
    items: [
      { label: 'Profile', href: '/admin/profile' },
      { label: 'Skills', href: '/admin/skills' },
      { label: 'GitHub', href: '/admin/repositories' },
      { label: 'Resume', href: '/admin/resume' },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Media', href: '/admin/media' },
      { label: 'Messages', href: '/admin/messages' },
      { label: 'Settings', href: '/admin/settings' },
    ],
  },
];
