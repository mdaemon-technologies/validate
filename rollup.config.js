import typescript from '@rollup/plugin-typescript'
import terser from '@rollup/plugin-terser';
import pkg from './package.json' with { type: "json" };

export default [
	// browser-friendly UMD build
	{
		input: 'src/validate.ts',
		output: [
			{ file: pkg.browser, format: 'umd',	exports: 'named', name: 'validate' },
			{ file: pkg.common,	format: 'cjs',	exports: 'named', name: 'validate' },
			{ file: pkg.module, format: 'es',	exports: 'named', name: 'validate' }
		],
		plugins: [
			typescript(),
			terser()
		]
	},
]