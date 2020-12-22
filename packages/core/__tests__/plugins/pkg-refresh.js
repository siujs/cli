const assert = require("assert");

/* istanbul ignore next */
module.exports = api => {
	api.build.process(ctx => {
		let pkgData = ctx.pkg();

		ctx.pkg({
			description: pkgData.meta.name
		});

		pkgData = ctx.pkg();

		assert.strictEqual(pkgData.meta.description, "@xxx/foo", "pkg refresh err");
	});

	api.build.error(ctx => {
		throw ctx.ex();
	});
};
