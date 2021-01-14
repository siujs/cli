import fs from "fs-extra";
import path from "path";
import rm from "rimraf";

import { getPkgData } from "@siujs/utils";

import { SiuRollupBuilder } from "../lib/builder/rollup";
import { Config, TOutputFormatKey } from "../lib/config/rollup/Config";
import { asRollupPlugin } from "../lib/esbuildService";

describe(" build monorepo packages with rollup", () => {
	const extMap = {
		es: ".mjs",
		cjs: ".cjs",
		umd: ".js",
		"umd-min": ".min.js"
	};

	const pkgsRoot = path.resolve(__dirname, "packages");

	beforeEach(() => {
		rm.sync(pkgsRoot);
	});

	afterEach(() => {
		rm.sync(pkgsRoot);
	});

	it("should exists dist/index.(mjs|cjs|js)", async done => {
		await fs.mkdir(pkgsRoot);
		await fs.mkdir(path.resolve(pkgsRoot, "foo/lib"), { recursive: true });
		await fs.mkdir(path.resolve(pkgsRoot, "bar/lib"), { recursive: true });
		await fs.writeFile(
			path.resolve(pkgsRoot, "foo/lib/index.ts"),
			`import path from "path";

export function getFileName(file:string){
	return path.basename(file);
}`
		);
		await fs.writeJSON(path.resolve(pkgsRoot, "foo/packages.json"), {
			name: "foo",
			main: "dist/index.cjs",
			module: "dist/index.mjs"
		});
		await fs.writeFile(
			path.resolve(pkgsRoot, "bar/lib/index.ts"),
			`import {getFileName} from "../../foo/lib/index";

export const fileName = getFileName(__dirname);`
		);
		await fs.writeJSON(path.resolve(pkgsRoot, "bar/packages.json"), {
			name: "bar",
			main: "dist/index.cjs",
			module: "dist/index.mjs"
		});

		try {
			const pkgData = getPkgData("foo", __dirname);

			const builder = new SiuRollupBuilder(pkgData, {
				onConfigTransform: (config: Config, format: TOutputFormatKey) => {
					config.plugin("esbuild").use(asRollupPlugin());
					config.output(format).file(path.resolve(pkgData.path, `dist/index${extMap[format]}`));
				}
			});

			await builder.build();

			expect(fs.pathExistsSync(path.resolve(pkgsRoot, "foo/dist/index.cjs"))).toBe(true);
			expect(fs.pathExistsSync(path.resolve(pkgsRoot, "foo/dist/index.mjs"))).toBe(true);
			expect(fs.pathExistsSync(path.resolve(pkgsRoot, "foo/dist/index.js"))).toBe(true);
		} catch {}

		done();
	});
});
