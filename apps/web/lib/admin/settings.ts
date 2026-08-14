/** Known site-setting keys, grouped for the settings form. Values are strings. */

export interface SettingField {
  key: string;
  label: string;
  multiline?: boolean;
  placeholder?: string;
}

export interface SettingGroup {
  title: string;
  fields: SettingField[];
}

export const SETTING_GROUPS: SettingGroup[] = [
  {
    title: 'General',
    fields: [
      { key: 'site_name', label: 'Site name' },
      { key: 'site_description', label: 'Site description', multiline: true },
    ],
  },
  {
    title: 'Contact',
    fields: [{ key: 'contact_email', label: 'Professional email', placeholder: 'you@example.com' }],
  },
  {
    title: 'Social',
    fields: [
      { key: 'linkedin_url', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/…' },
      { key: 'github_url', label: 'GitHub', placeholder: 'https://github.com/…' },
    ],
  },
  {
    title: 'SEO defaults',
    fields: [
      { key: 'default_seo_title', label: 'Default SEO title' },
      { key: 'default_seo_description', label: 'Default SEO description', multiline: true },
      { key: 'default_og_image', label: 'Default OG image URL', placeholder: 'https://…' },
    ],
  },
  {
    title: 'Footer',
    fields: [{ key: 'footer_text', label: 'Footer text', multiline: true }],
  },
];

export const ALL_SETTING_KEYS = SETTING_GROUPS.flatMap((g) => g.fields.map((f) => f.key));
