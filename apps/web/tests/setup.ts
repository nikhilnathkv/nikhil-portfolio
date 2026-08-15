import '@testing-library/jest-dom/vitest';

import { toHaveNoViolations } from 'jest-axe';
import { expect } from 'vitest';

// Register the jest-axe matcher for accessibility tests.
expect.extend(toHaveNoViolations);
