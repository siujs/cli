const assert = require("assert");

/* istanbul ignore next */
module.exports = api => {
	api.build.process(ctx => {
		let pkgData = ctx.pkg();

		ctx.pkg({
			description: pkgData.meta.name
		});
	});

	api.build.complete(ctx => {
		pkgData = ctx.pkg();
		assert.strictEqual(pkgData.meta.description, "@xxx/foo", "pkg refresh err");
	});
};
