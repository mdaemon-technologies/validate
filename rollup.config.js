import commonjs from '@rollup/plugin-commonjs';
import pkg from './package.json';

export default [
	// browser-friendly UMD build
	{
		input: 'src/validate.js',
		output: {
			name: 'validate',
			file: pkg.browser,
			format: 'umd'
		},
		plugins: [
			commonjs() // so Rollup can convert `ms` to an ES module
		]
	},
	{
		input: 'src/validate.js',
		output: [
			{ file: pkg.main, format: 'cjs' },
			{ file: pkg.module, format: 'es' }
		]
	}
]