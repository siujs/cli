import fs from "fs-extra";
import path from "path";
import sh from "shelljs";

export function createSiuConfigJs(cwd: string) {
	fs.writeFileSync(
		path.resolve(cwd, "siu.config.js"),
		`module.exports = {
	pkgsOrder: "auto",
	plugins: ["./plugins/local-npm-package", "./plugins/cli-opts"]
}`
	);

	return () => {
		sh.rm("-rf", path.resolve(cwd, "siu.config.js"));
	};
}

export function createSiuConfigTs(cwd: string) {
	fs.writeFileSync(
		path.resolve(cwd, "siu.config.ts"),
		`export default {
	pkgsOrder: "auto",
	plugins: ["./plugins/local-npm-package", "./plugins/cli-opts"]
}`
	);

	return () => {
		sh.rm("-rf", path.resolve(cwd, "siu.config.ts"));
	};
}

export function createSiuPackageJSON(cwd: string) {
	fs.writeJSONSync(path.resolve(cwd, "package.json"), {
		name: "xxx",
		siu: {
			pkgsOrder: "auto",
			plugins: ["./plugins/local-npm-package", "./plugins/cli-opts"]
		}
	});

	return () => {
		sh.rm("-rf", path.resolve(cwd, "package.json"));
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
