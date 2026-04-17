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
      // Severity 'warn' for now because pre-existing sites outside the booking
      // flow still have business arithmetic (timer displays, admin dashboards,
      // etc.). Catches new regressions without breaking the build on legacy code.
      // Escalate to 'error' once the backlog clears.
      'event-platform/no-business-calc-in-jsx': 'warn',
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
])
