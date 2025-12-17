import config from '@ljharb/eslint-config/flat/node/16';

export default [
	...config,
	{
		rules: {
			'func-style': 'off',
			'max-lines-per-function': 'off',
			'no-extra-parens': 'off',
			'object-curly-newline': 'off',
			'sort-keys': 'off',
		},
	},
];
