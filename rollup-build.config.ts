import {clean, importStyles, minifyLitHTML} from "@appnest/web-config";
import ts from '@wessberg/rollup-plugin-ts';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import path from 'path';
import precss from 'precss';
import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import progress from 'rollup-plugin-progress';
import {terser} from 'rollup-plugin-terser';
import pkg from "./package.json";

const folders = {
	src: path.resolve(__dirname, "src/lib"),
	dist: path.resolve(__dirname, "dist"),
	dist_umd: path.resolve(__dirname, "dist/umd"),
};

const files = {
	src_index: path.join(folders.src, "index.ts"),
	dist_umd_weightless: path.join(folders.dist_umd, "weightless.min.js")
};

const plugins = ({tsConfig} = {}) => [
	progress(),
	resolve(),
	importStyles({
		plugins: [
			precss(),
			autoprefixer(),
			cssnano({
				preset: ["default", {
					calc: false
				}]
			})
		]
	}),
	// Teaches Rollup how to transpile Typescript
	// https://github.com/wessberg/rollup-plugin-ts
	ts(tsConfig || {}),

	// At the moment, the majority of packages on NPM are exposed as CommonJS modules
	commonjs({
		include: "**/node_modules/**",
	}),

	minifyLitHTML({
		verbose: false
	})
];

const configs = [
	{
		input: files.src_index,
		output: [
			{
				format: "esm",
				dir: folders.dist
			}
		],
		treeshake: false,
		preserveModules: true,
		plugins: [
			clean({
				targets: [
					folders.dist
				]
			}),
			...plugins({
				tsConfig: {
					transpiler: "typescript",
					tsconfig: "tsconfig.build.json",
					exclude: ["node_modules/**/*.*"],
					browserslist: false,
				}
			})
		],
		external: [
			...Object.keys(pkg.dependencies),
			...Object.keys(pkg.devDependencies),
			"@a11y/focus-trap/debounce",
			"lit-html/directives/if-defined",
			"tslib"
		]
	},
	{
		input: files.src_index,
		output: [
			{
				format: "umd",
				name: "weightless",
				file: files.dist_umd_weightless,
				banner: `/** weightless v${pkg.version} **/`
			}
		],
		treeshake: true,
		plugins: [
			...plugins(),
			terser({
				output: {
					comments: /.*weightless v.*/
				}
			})
		],
		context: "window"
	}
];

export default configs;

