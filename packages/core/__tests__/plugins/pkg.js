const assert = require("assert");

const path = require("path");

/* istanbul ignore next */
module.exports = api => {
	api.build.process(ctx => {
		const pkgData = ctx.pkg();

		const root = path.resolve(__dirname, "../");
		const pkgsRoot = path.resolve(root, "packages");

		console.log(pkgData);

		assert.strictEqual(pkgData.root, root, `pkg root err`);
		assert.strictEqual(pkgData.pkgsRoot, pkgsRoot, `pkg pkgsRoot err`);
		assert.strictEqual(pkgData.name, "@xxx/foo", `pkg name err`);
		assert.strictEqual(pkgData.dirName, "foo", `pkg dirName err`);
		assert.strictEqual(pkgData.path, path.resolve(pkgsRoot, "foo"), `pkg path err`);
		assert.strictEqual(pkgData.umdName, "Foo", `pkg umdName err`);
		assert.strictEqual(pkgData.metaPath, path.resolve(pkgsRoot, "foo/package.json"), `pkg metaPath err`);
		assert.strictEqual(pkgData.meta.name, "@xxx/foo", `pkg meta.name err`);
	});

	api.build.error(ctx => {
		throw ctx.ex();
	});
};
