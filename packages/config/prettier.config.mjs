/**
 * Shared Prettier configuration. The repo root re-uses these defaults via
 * .prettierrc.json; packages can import this module directly if they need to
 * override or extend it.
 */
export default {
  semi: true,
  singleQuote: true,
  trailingComma: 'all',
  printWidth: 100,
  tabWidth: 2,
  arrowParens: 'always',
};
