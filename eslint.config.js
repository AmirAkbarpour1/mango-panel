import {
  combine,
  comments,
  ignores,
  imports,
  javascript,
  jsdoc,
  jsonc,
  markdown,
  node,
  sortPackageJson,
  sortTsconfig,
  stylistic,
  toml,
  typescript,
  unicorn,
  yaml,
} from '@antfu/eslint-config'
import simpleImportSort from 'eslint-plugin-simple-import-sort'

export default combine(
  ignores(),
  javascript(),
  comments(),
  node(),
  jsdoc(),
  imports(),
  sortTsconfig(),
  sortPackageJson(),
  unicorn(),
  typescript(),
  stylistic(),
  jsonc(),
  yaml(),
  toml(),
  markdown(),
  {
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'import/first': 'error',
      'import/newline-after-import': 'error',
      'import/no-duplicates': 'error',
    },
  },
  {
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['./**', '../**'],
              message: 'Please use absolute imports instead of relative ones',
            },
          ],
        },
      ],
    },
  },
)
