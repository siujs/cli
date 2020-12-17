import fs from "fs-extra";
import path from "path";
import externals from "rollup-plugin-node-externals";
import cjs from "@rollup/plugin-commonjs";
import nodeResolve from "@rollup/plugin-node-resolve";
import json from "@rollup/plugin-json";
import { startService } from "esbuild";
import { createFilter } from "@rollup/pluginutils";

const defaultLoaders = {
	".js": "js",
	".jsx": "jsx",
	".ts": "ts",
	".tsx": "tsx"
};

const esbuildRollupPlugin = (options = {}) => {
	let target;

	const loaders = {
		...defaultLoaders
	};

	if (options.loaders) {
		for (const key of Object.keys(options.loaders)) {
			const value = options.loaders[key];
			if (typeof value === "string") {
				loaders[key] = value;
			} else if (value === false) {
				delete loaders[key];
			}
		}
	}

	const extensions = Object.keys(loaders);
	const INCLUDE_REGEXP = new RegExp(`\\.(${extensions.map(ext => ext.slice(1)).join("|")})$`);
	const EXCLUDE_REGEXP = /node_modules/;

	const filter = createFilter(options.include || INCLUDE_REGEXP, options.exclude || EXCLUDE_REGEXP);

	let service;

	const stopService = () => {
		if (service) {
			service.stop();
			service = undefined;
		}
	};

	// The order is:
	// buildStart -> resolveId -> transform -> buildEnd -> renderChunk -> generateBundle

	const resolveFile = (resolved, index = false) => {
		for (const ext of extensions) {
			const file = index ? path.join(resolved, `index${ext}`) : `${resolved}${ext}`;
			if (fs.existsSync(file)) return file;
		}
		return null;
	};

	return {
		name: "esbuild",

		async buildStart() {
			if (!service) {
				service = await startService();
			}
		},

		resolveId(importee, importer) {
			if (importer && importee[0] === ".") {
				const resolved = path.resolve(importer ? path.dirname(importer) : process.cwd(), importee);

				let file = resolveFile(resolved);
				if (file) return file;
				if (!file && fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) {
					file = resolveFile(resolved, true);
					if (file) return file;
				}
			}
		},

		async transform(code, id) {
			if (!filter(id)) {
				return null;
			}

			const ext = path.extname(id);
			const loader = loaders[ext];

			if (!loader || !service) {
				return null;
			}

			const defaultOptions = {};

			target = options.target || defaultOptions.target || "esnext";

			const result = await service.transform(code, {
				loader,
				target,
				jsxFactory: options.jsxFactory || defaultOptions.jsxFactory,
				jsxFragment: options.jsxFragment || defaultOptions.jsxFragment,
				define: options.define,
				sourcemap: options.sourceMap !== false,
				sourcefile: id
			});

			printWarnings(id, result, this);

			return result;
		},

		buildEnd(error) {
			// Stop the service early if there's error
			if (error && !this.meta.watchMode) {
				stopService();
			}
		},

		async renderChunk(code) {
			if (options.minify && service) {
				const result = await service.transform(code, {
					loader: "js",
					minify: true,
					target
				});
				if (result.cpde) {
					return result;
				}
			}
			return null;
		},

		generateBundle() {
			if (!this.meta.watchMode) {
				stopService();
			}
		}
	};
};

function printWarnings(id, result, plugin) {
	if (result.warnings) {
		for (const warning of result.warnings) {
			let message = `[esbuild]`;
			if (warning.location) {
				message += ` (${path.relative(process.cwd(), id)}:${warning.location.line}:${warning.location.column})`;
			}
			message += ` ${warning.text}`;
			plugin.warn(message);
		}
	}
}

const packagesRoot = path.resolve(__dirname, "./packages/");

const pkgDirList = fs.readdirSync(packagesRoot);

function resolvePkgInput(pkgDir) {
	return path.resolve(packagesRoot, pkgDir, "./lib/index.ts");
}

function resolvePkgOutput(pkgDir, format) {
	return path.resolve(packagesRoot, pkgDir, `./dist/index.${format === "es" ? "mjs" : "js"}`);
}

function getPkgDeps(pkgDir) {
	const meta = fs.readJSONSync(path.resolve(packagesRoot, pkgDir, "package.json"));

	return {
		...(meta.dependencies || {}),
		...(meta.peerDependencies || {}),
		...(meta.devDependencies || {})
	};
}

const utilsDeps = getPkgDeps("utils");

const configs = pkgDirList.map(pkgDir => {
	const deps = {
		...getPkgDeps(pkgDir),
		...utilsDeps
	};

	return {
		input: resolvePkgInput(pkgDir),
		output: [
			{
				format: "cjs",
				file: resolvePkgOutput(pkgDir),
				sourcemap: true
			},
			{
				format: "es",
				file: resolvePkgOutput(pkgDir, "es"),
				sourcemap: true
			}
		],
		plugins: [
			json({
				namedExports: false
			}),
			nodeResolve({
				preferBuiltins: false
			}),
			cjs(),
			externals(),
			esbuildRollupPlugin()
		],
		external: Object.keys(deps),
		onwarn: (msg, warn) => {
			if (!/Circular/.test(msg)) {
				warn(msg);
			}
		},
		treeshake: {
			moduleSideEffects: false
		}
	};
});

export default configs;
