import fs from "fs-extra";
import path from "path";
import sh from "shelljs";

export async function createSiuConfigJs(cwd: string) {
	await fs.writeFile(
		path.resolve(cwd, "siu.config.js"),
		`module.exports = {
	pkgsOrder: "auto",
	plugins: ["../plugins/local-npm-package", "../plugins/cli-opts"]
}`
	);

	return () => {
		sh.rm("-rf", [path.resolve(cwd, "siu.config.js")]);
	};
}

export async function createSiuConfigTs(cwd: string) {
	await fs.writeFile(
		path.resolve(cwd, "siu.config.ts"),
		`export default {
	pkgsOrder: "auto",
	plugins: ["../plugins/local-npm-package", "../plugins/cli-opts"]
}`
	);

	return () => {
		sh.rm("-rf", [path.resolve(cwd, "siu.config.ts")]);
	};
}

export async function createSiuPackageJSON(cwd: string) {
	await fs.writeJSON(path.resolve(cwd, "package.json"), {
		name: "xxx",
		siu: {
			pkgsOrder: "auto",
			plugins: ["../plugins/local-npm-package", "../plugins/cli-opts"]
		}
	});

	return () => {
		sh.rm("-rf", [path.resolve(cwd, "package.json")]);
	};
}

export function createFooPackage(cwd: string) {
	sh.mkdir("-p", path.resolve(cwd, "packages"));
	sh.mkdir("-p", path.resolve(cwd, "packages", "foo"));
	fs.writeJSONSync(path.resolve(cwd, "packages/foo/package.json"), {
		name: "@xxx/foo"
	});

	return (rmAll = false) => {
		sh.rm("-rf", path.resolve(cwd, rmAll ? "packages" : "packages/foo"));
	};
}

export async function createFooNode_Modules(cwd: string) {
	sh.mkdir("-p", path.resolve(cwd, "node_modules"));
	sh.mkdir("-p", path.resolve(cwd, "node_modules/siujs-plugin-foo"));
	await fs.writeJSON(path.resolve(cwd, "node_modules/siujs-plugin-foo/package.json"), {
		name: "siujs-plugin-foo",
		main: "index.js"
	});
	await fs.writeFile(
		path.resolve(cwd, "node_modules/siujs-plugin-foo/index.js"),
		`module.exports = api => {
		api.build.start(() => {});
	};`
	);

	return () => {
		sh.rm("-rf", path.resolve(cwd, "node_modules"));
	};
}
