export default [
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        // Node.js globals
        process: 'readonly',
        console: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        Buffer: 'readonly',
        global: 'readonly',
        setImmediate: 'readonly',
        clearImmediate: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        // Add other Node.js globals as needed
      }
    },
    rules: {
      // Possible Errors
      'no-unused-vars': ['warn', {
        'argsIgnorePattern': '^_',
        'varsIgnorePattern': '^_'
      }],
      'no-undef': 'error',
      'no-constant-condition': 'error',
      'no-duplicate-imports': 'error',
      'no-dupe-keys': 'error',
      'no-dupe-args': 'error',
      'no-unreachable': 'error',
      'no-unsafe-finally': 'error',

      // Best Practices
      'eqeqeq': ['warn', 'always'],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-with': 'error',
      'no-var': 'warn',
      'prefer-const': 'warn',
      'no-empty': 'warn',

      // Style (optional, adjust to your preference)
      'no-console': 'off', // Allow console for Node.js backend
      'semi': ['warn', 'always'],
      'quotes': ['warn', 'single', { 'avoidEscape': true }],

      // ES6+
      'no-useless-constructor': 'warn',
      'prefer-arrow-callback': 'warn',
      'prefer-template': 'warn',
    }
  },
  {
    // Ignore node_modules and other directories
    ignores: [
      'node_modules/**',
      'logs/**',
      'coverage/**',
      'dist/**',
      'build/**'
    ]
  }
];
