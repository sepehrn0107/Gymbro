import { FlatCompat } from '@eslint/eslintrc'

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
})

const eslintConfig = [
  ...compat.extends(
    'next/core-web-vitals',
    'next/typescript',
    'prettier',
  ),
  {
    rules: {
      // Disallow any — use unknown with type narrowing
      '@typescript-eslint/no-explicit-any': 'error',
      // Prefer ts-expect-error over ts-ignore
      '@typescript-eslint/ban-ts-comment': [
        'error',
        { 'ts-ignore': true, 'ts-expect-error': 'allow-with-description' },
      ],
    },
  },
]

export default eslintConfig
