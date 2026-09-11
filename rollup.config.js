import typescript from '@rollup/plugin-typescript'
import terser from '@rollup/plugin-terser';
import dts from 'rollup-plugin-dts';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pkg = require('./package.json');

export default [
	// browser-friendly UMD build
	{
		input: 'src/validate.ts',
		output: [
			{ file: pkg.browser, format: 'umd',	exports: 'named', name: 'validate' },
			{ file: pkg.common,	format: 'cjs',	exports: 'named' },
			{ file: pkg.module, format: 'es',	exports: 'named' }
		],
		plugins: [
			typescript({ tsconfig: './tsconfig.build.json' }),
			terser()
		]
	},
	// Type declarations, bundled into one self-contained file per module system.
	// The package is "type": "module", so a .d.ts is read as ESM; CommonJS
	// consumers need the .d.cts copy.
	{
		input: 'src/validate.ts',
		output: [
			{ file: 'dist/index.d.ts', format: 'es' },
			{ file: 'dist/index.d.cts', format: 'es' }
		],
		plugins: [dts({ tsconfig: './tsconfig.build.json' })]
	},
]
