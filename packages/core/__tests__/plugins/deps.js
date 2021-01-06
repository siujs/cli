const assert = require("assert");

/* istanbul ignore next */
module.exports = api => {
	api.deps.start(ctx => {
		return ctx.ex("deps called");
	});

	api.deps.error(ctx => {
		const err = ctx.ex();
		assert.strictEqual("deps called", err);
	});
};
