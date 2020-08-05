module.exports = {
  extends: 'airbnb-base',
  env: {
    mocha: true
  },
  rules: {
    // General
    'operator-linebreak': ['error', 'after'],
    'linebreak-style': 'off',
    'comma-dangle': 'off',
    'arrow-body-style': 'warn',
    'arrow-parens': ['error', 'as-needed'],
    'no-nested-ternary': 'off',
    'max-len': 'off',
    'no-underscore-dangle': 'off',
    'no-await-in-loop': 'warn',
    'object-curly-newline': 'off'
  }
};
