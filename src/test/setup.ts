// Required for vitest -- see this section in vite.config.ts:
//   test: {
//     globals: true,
//     setupFiles: 'src/test/setup.ts'
//   }
//
// Source: this article: https://dev.to/mbarzeev/from-jest-to-vitest-migration-and-benchmark-23pl
// Refers to:
//   https://github.com/vitest-dev/vitest/blob/main/examples/react-testing-lib/vite.config.ts
//   https://github.com/vitest-dev/vitest/blob/main/examples/react-testing-lib/src/test/setup.ts

import '@testing-library/jest-dom'
