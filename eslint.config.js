import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'
import noBusinessCalcInJsx from './tools/eslint-rules/no-business-calc-in-jsx.js'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    plugins: {
      'event-platform': {
        rules: {
          'no-business-calc-in-jsx': noBusinessCalcInJsx,
        },
      },
    },
    rules: {
      // Severity 'error': the backlog has been cleared. Intentional exceptions use
      // `// eslint-disable-next-line event-platform/no-business-calc-in-jsx -- <reason>`.
      'event-platform/no-business-calc-in-jsx': 'error',
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
])
