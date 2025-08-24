import config from '@padcom/eslint-config-vue'

export default [
  ...config['flat/browser'],
  {
    rules: {
      'jsdoc/require-jsdoc': 'off',
      '@typescript-eslint/await-thenable': 'off',
      'vue/no-static-inline-styles': 'off',
      'max-nested-callbacks': 'off',
    },
  },
]
