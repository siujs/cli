const assert = require("assert");

/* istanbul ignore next */
module.exports = api => {
	api.create.process(() => {});

	api.create.complete(ctx => {
		return ctx.ex("complete");
	});

	api.create.error(ctx => {
		const ex = ctx.ex();
		assert.strictEqual(ex, "complete");
	});
};
