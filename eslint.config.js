// @ts-check
/* eslint-disable sort-keys-fix/sort-keys-fix */
import stylisticJs from '@stylistic/eslint-plugin-js'
import stylisticTs from '@stylistic/eslint-plugin-ts'
// @ts-ignore
import pluginImport from 'eslint-plugin-import'
import pluginNode from 'eslint-plugin-n'
import pluginSortKeysFix from 'eslint-plugin-sort-keys-fix'
import pluginTypescriptSortKeys from 'eslint-plugin-typescript-sort-keys'
import tsEslint from 'typescript-eslint'

const ignoredPaths = [
  '.yarn/**/*',
  '**/node_modules/**/*',
  '**/dist/**/*',
  '**/build/**/*',
  'loader/**/*',
  '.vscode/**/*',
  '.idea/**/*',
]

export default tsEslint.config(
  { name: 'Ignored files', ignores: ignoredPaths },

  {
    name: 'Base config',
    files: ['**/*.{mjs,cjs,js,ts}'],
    languageOptions: { ecmaVersion: 2025 },
    linterOptions: { reportUnusedDisableDirectives: 'warn' },
    plugins: {
      '@stylistic/js': stylisticJs,
      import: pluginImport,
      // @ts-ignore
      'sort-keys-fix': pluginSortKeysFix,
      n: pluginNode,
    },
    rules: {
      // http://eslint.org/docs/rules/
      '@stylistic/js/array-bracket-spacing': ['error', 'never'],
      'array-callback-return': 'error',
      '@stylistic/js/arrow-spacing': 'error',
      'block-scoped-var': 'error',
      '@stylistic/js/block-spacing': ['error', 'always'],
      '@stylistic/js/brace-style': ['error', '1tbs', { allowSingleLine: true }],
      camelcase: ['error', { ignoreDestructuring: true, properties: 'never', allow: ['__mia_configuration'] }],
      '@stylistic/js/comma-dangle': [
        'error',
        { arrays: 'always-multiline', exports: 'always-multiline', functions: 'ignore', imports: 'always-multiline', objects: 'always-multiline' },
      ],
      '@stylistic/js/comma-spacing': 'error',
      '@stylistic/js/comma-style': 'error',
      '@stylistic/js/computed-property-spacing': ['error', 'never'],
      'constructor-super': 'error',
      curly: 'error',
      'default-case': ['error', { commentPattern: '^skip\\sdefault' }],
      '@stylistic/js/dot-location': ['error', 'property'],
      '@stylistic/js/eol-last': 'error',
      eqeqeq: ['error', 'smart'],
      'for-direction': 'error',
      '@stylistic/js/func-call-spacing': 'off',
      'func-name-matching': 'error',
      'func-names': ['error', 'as-needed'],
      'func-style': ['error', 'expression'],
      '@stylistic/js/generator-star-spacing': 'error',
      'getter-return': 'error',
      'global-require': 'error',
      'guard-for-in': 'error',
      'handle-callback-err': 'error',
      'id-blacklist': ['error', 'e', 'er', 'cb'],
      'id-length': ['error', { exceptions: ['_', 'i', 'j', 'x', 'y', 'z'], min: 2, properties: 'never' }],
      '@stylistic/js/indent': ['error', 2],
      '@stylistic/js/key-spacing': 'error',
      '@stylistic/js/keyword-spacing': 'error',
      '@stylistic/js/line-comment-position': 'error',
      '@stylistic/js/linebreak-style': ['error', 'unix'],
      '@stylistic/js/lines-around-comment': 'off',
      'max-depth': ['error', 4],
      'max-lines': ['error', { max: 500, skipBlankLines: true, skipComments: true }],
      'max-statements': ['off'],
      '@stylistic/js/max-statements-per-line': ['error', { max: 2 }],
      '@stylistic/js/new-parens': 'error',
      '@stylistic/js/newline-per-chained-call': ['error', { ignoreChainWithDepth: 3 }],
      'no-array-constructor': 'error',
      'no-async-promise-executor': 'error',
      'no-await-in-loop': 'off',
      'no-caller': 'error',
      'no-case-declarations': 'error',
      'no-class-assign': 'error',
      'no-compare-neg-zero': 'error',
      'no-cond-assign': ['error', 'except-parens'],
      '@stylistic/js/no-confusing-arrow': ['error', { allowParens: true }],
      'no-console': ['error', { allow: ['error'] }],
      'no-const-assign': 'error',
      'no-constant-condition': 'error',
      'no-control-regex': 'error',
      'no-debugger': 'error',
      'no-delete-var': 'error',
      'no-dupe-args': 'error',
      'no-dupe-class-members': 'error',
      'no-dupe-else-if': 'error',
      'no-dupe-keys': 'error',
      'no-duplicate-case': 'error',
      'no-duplicate-imports': 'error',
      'no-else-return': 'error',
      'no-empty': 'error',
      'no-empty-character-class': 'error',
      'no-empty-function': 'error',
      'no-empty-pattern': 'error',
      'no-eq-null': 'error',
      'no-eval': 'error',
      'no-ex-assign': 'error',
      'no-extend-native': 'error',
      'no-extra-bind': 'error',
      'no-extra-boolean-cast': 'error',
      'no-extra-label': 'error',
      '@stylistic/js/no-extra-parens': ['error', 'functions'],
      '@stylistic/js/no-extra-semi': 'error',
      'no-fallthrough': 'error',
      '@stylistic/js/no-floating-decimal': 'error',
      'no-func-assign': 'error',
      'no-global-assign': 'error',
      'no-implicit-globals': 'error',
      'no-implied-eval': 'error',
      'no-import-assign': 'error',
      'no-inner-declarations': 'error',
      'no-invalid-regexp': 'error',
      'no-irregular-whitespace': 'error',
      'no-iterator': 'error',
      'no-label-var': 'error',
      'no-labels': ['error', { allowLoop: true, allowSwitch: false }],
      'no-lone-blocks': 'error',
      'no-lonely-if': 'error',
      'no-loop-func': 'error',
      'no-loss-of-precision': 'error',
      'no-misleading-character-class': 'error',
      '@stylistic/js/no-mixed-operators': [
        'error',
        {
          allowSamePrecedence: false,
          groups: [
            ['&', '|', '^', '~', '<<', '>>', '>>>'],
            ['==', '!=', '===', '!==', '>', '>=', '<', '<='],
            ['&&', '||'],
            ['in', 'instanceof'],
          ],
        },
      ],
      '@stylistic/js/no-mixed-spaces-and-tabs': 'error',
      'no-multi-assign': 'error',
      '@stylistic/js/no-multi-spaces': 'error',
      'no-multi-str': 'error',
      '@stylistic/js/no-multiple-empty-lines': 'error',
      'no-nested-ternary': 'error',
      'no-new': 'error',
      'no-new-func': 'error',
      'no-new-object': 'error',
      'no-new-require': 'error',
      'no-new-symbol': 'error',
      'no-new-wrappers': 'error',
      'no-nonoctal-decimal-escape': 'error',
      'no-obj-calls': 'error',
      'no-octal': 'error',
      'no-octal-escape': 'error',
      'no-param-reassign': 'error',
      'no-path-concat': 'error',
      'no-plusplus': ['error', { allowForLoopAfterthoughts: true }],
      'no-proto': 'error',
      'no-prototype-builtins': 'error',
      'no-regex-spaces': 'error',
      // @ts-ignore
      'no-restricted-globals': ['error'],
      'no-restricted-properties': [
        'error',
        { message: 'Please use import() instead', object: 'require', property: 'ensure' },
        { message: 'Please use import() instead', object: 'System', property: 'import' },
      ],
      'no-restricted-syntax': ['error', 'WithStatement'],
      'no-return-assign': 'error',
      'no-return-await': 'error',
      'no-script-url': 'error',
      'no-self-assign': 'error',
      'no-self-compare': 'error',
      'no-sequences': 'error',
      'no-setter-return': 'error',
      'no-shadow-restricted-names': 'error',
      'no-sparse-arrays': 'error',
      'no-sync': 'error',
      '@stylistic/js/no-tabs': 'error',
      'no-template-curly-in-string': 'error',
      'no-this-before-super': 'error',
      'no-throw-literal': 'error',
      '@stylistic/js/no-trailing-spaces': 'error',
      'no-undef': 'error',
      'no-undef-init': 'error',
      'no-unexpected-multiline': 'error',
      'no-unmodified-loop-condition': 'error',
      'no-unneeded-ternary': 'error',
      'no-unreachable': 'error',
      'no-unsafe-finally': 'error',
      'no-unsafe-negation': 'error',
      'no-unsafe-optional-chaining': 'error',
      'no-unused-expressions': ['error', { allowShortCircuit: true, allowTaggedTemplates: true, allowTernary: true }],
      'no-unused-labels': 'error',
      'no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_(?:[0-9]+)?',
          destructuredArrayIgnorePattern: '^_(?:[0-9]+)?',
          ignoreRestSiblings: true,
        },
      ],
      'no-use-before-define': ['error', { functions: false }],
      'no-useless-backreference': 'error',
      'no-useless-call': 'error',
      'no-useless-catch': 'error',
      'no-useless-computed-key': 'error',
      'no-useless-concat': 'error',
      'no-useless-constructor': 'error',
      'no-useless-escape': 'error',
      'no-useless-rename': ['error', { ignoreDestructuring: false, ignoreExport: false, ignoreImport: false }],
      'no-useless-return': 'error',
      'no-var': 'error',
      'no-void': 'error',
      '@stylistic/js/no-whitespace-before-property': 'error',
      'no-with': 'error',
      '@stylistic/js/nonblock-statement-body-position': 'error',
      '@stylistic/js/object-curly-spacing': ['error', 'always'],
      '@stylistic/js/object-property-newline': ['error', { allowMultiplePropertiesPerLine: true }],
      'object-shorthand': 'error',
      '@stylistic/js/one-var-declaration-per-line': 'error',
      'operator-assignment': 'error',
      '@stylistic/js/operator-linebreak': ['error', 'before'],
      '@stylistic/js/padded-blocks': ['error', 'never'],
      'prefer-arrow-callback': ['error', { allowNamedFunctions: true }],
      'prefer-const': 'error',
      'prefer-destructuring': [
        'error',
        {
          AssignmentExpression: { array: false, object: false },
          VariableDeclarator: { array: true, object: true },
        },
        { enforceForRenamedProperties: false },
      ],
      'prefer-object-spread': 'error',
      'prefer-promise-reject-errors': 'error',
      'prefer-rest-params': 'error',
      'prefer-spread': 'error',
      'prefer-template': 'error',
      '@stylistic/js/quote-props': ['error', 'as-needed'],
      '@stylistic/js/quotes': ['error', 'single', { allowTemplateLiterals: true, avoidEscape: true }],
      'require-atomic-updates': 'error',
      'require-yield': 'error',
      '@stylistic/js/rest-spread-spacing': ['error', 'never'],
      '@stylistic/js/semi': ['error', 'never'],
      '@stylistic/js/semi-spacing': 'error',
      'sort-imports': 'off',
      '@stylistic/js/space-before-blocks': 'error',
      '@stylistic/js/space-before-function-paren': ['error', { anonymous: 'always', named: 'never' }],
      '@stylistic/js/space-in-parens': 'error',
      '@stylistic/js/space-infix-ops': 'error',
      '@stylistic/js/space-unary-ops': 'error',
      '@stylistic/js/spaced-comment': ['error', 'always', { exceptions: ['!'], markers: ['/'] }],
      strict: ['error', 'never'],
      'symbol-description': 'error',
      '@stylistic/js/template-curly-spacing': 'error',
      '@stylistic/js/template-tag-spacing': 'error',
      'unicode-bom': ['error', 'never'],
      'use-isnan': 'error',
      // https://eslint.org/blog/2018/11/jsdoc-end-of-life/
      'valid-jsdoc': 'off',
      'valid-typeof': ['error', { requireStringLiterals: true }],
      'vars-on-top': 'error',
      '@stylistic/js/wrap-iife': 'error',
      '@stylistic/js/yield-star-spacing': 'error',

      // https://github.com/benmosher/eslint-plugin-import/tree/master/docs/rules
      'import/export': 'error',
      'import/no-duplicates': 'error',
      'import/order': [
        'error',
        {
          alphabetize: { caseInsensitive: true, order: 'asc' },
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
        },
      ],

      // https://github.com/eslint-community/eslint-plugin-n/tree/master/docs/rules
      'n/callback-return': ['error', ['callback', 'cb', 'next', 'done']],

      // https://github.com/leo-buneev/eslint-plugin-sort-keys-fix
      'sort-keys-fix/sort-keys-fix': ['error', 'asc'],
    },
  },

  {
    name: 'Typescript config',
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsEslint.parser,
      parserOptions: { project: true },
    },
    plugins: {
      '@stylistic/ts': stylisticTs,
      '@typescript-eslint': tsEslint.plugin,
      'typescript-sort-keys': pluginTypescriptSortKeys,
    },
    settings: {
      'import/resolver': { typescript: true },
    },
    rules: {
      ...tsEslint.configs.strict[2].rules,
      ...tsEslint.configs.recommendedTypeChecked[2].rules,

      // TypeScript's `noFallthroughCasesInSwitch` option is more robust (#6906)
      'default-case': 'off',
      // 'tsc' already handles this (https://github.com/typescript-eslint/typescript-eslint/issues/291)
      'no-dupe-class-members': 'off',
      // 'tsc' already handles this (https://github.com/typescript-eslint/typescript-eslint/issues/477)
      'no-undef': 'off',
      'no-duplicate-imports': 'off',
      'no-shadow': 'off',
      'sort-imports': 'off',
      'no-use-before-define': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',

      '@typescript-eslint/consistent-type-imports': 'error',
      '@stylistic/ts/member-delimiter-style': [
        2,
        {
          multiline: { delimiter: 'none', requireLast: false },
          multilineDetection: 'brackets',
          singleline: { delimiter: 'semi', requireLast: false },
        },
      ],
      '@typescript-eslint/no-invalid-void-type': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_(?:[0-9]+)?',
          destructuredArrayIgnorePattern: '^_(?:[0-9]+)?',
          ignoreRestSiblings: true,
        },
      ],
      '@typescript-eslint/non-nullable-type-assertion-style': 'off',
      '@typescript-eslint/no-use-before-define': ['error', { typedefs: false }],

      'typescript-sort-keys/interface': 'error',
      'typescript-sort-keys/string-enum': 'error',

      'n/no-missing-import': 'off',
      'n/no-unpublished-import': 'off',
    },
  },

  {
    name: 'Tests config',
    files: ['**/*.test.*'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      'no-await-in-loop': 'off',
      'no-sync': 'off',
      'max-lines': 'off',
      'no-floating-promises': 'off',
      'no-debugger': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  }
)
