import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import pkg from './package.json';

export default [
	// browser-friendly UMD build
	{
		input: 'src/validate.js',
		output: {
			name: 'validate',
			file: pkg.browser,
			format: 'umd',
			exports: 'named'
		},
		plugins: [
			commonjs(), // so Rollup can convert `ms` to an ES module
			terser()
		]
	},
	{
		input: 'src/validate.js',
		output: [
			{ 
				file: pkg.main,
				format: 'cjs',
				exports: 'named'
			},
			{ 
				file: pkg.module, 
				format: 'es',
				exports: 'named'
			}
		],
		plugins: [ 
			terser()
		]
	}
]