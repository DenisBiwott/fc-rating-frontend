import js from '@eslint/js'
import eslintConfigPrettier from 'eslint-config-prettier'
import vue from 'eslint-plugin-vue'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: ['dist/**', 'coverage/**', 'src/api/schema.d.ts', 'public/mockServiceWorker.js'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...vue.configs['flat/recommended'],
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
      },
    },
  },
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      'vue/multi-word-component-names': 'off',
      // Props are declared via defineProps<{...}>() (type-only, per CLAUDE.md's non-negotiable),
      // where TypeScript's `?:` already documents optionality — an optional prop that's
      // genuinely meant to stay undefined (e.g. AvatarTile's `medal`) isn't a missing default,
      // it's the point.
      'vue/require-default-prop': 'off',
    },
  },
  eslintConfigPrettier,
)
