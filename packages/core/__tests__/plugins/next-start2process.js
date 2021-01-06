const assert = require("assert");

/* istanbul ignore next */
module.exports = api => {
	api.create.start(() => {});

	api.create.process(ctx => {
		ctx.ex("process");
	});

	api.create.error(ctx => {
		const ex = ctx.ex();
		assert.strictEqual(ex, "process");
	});
};
