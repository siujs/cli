const assert = require("assert");

/* istanbul ignore next */
module.exports = api => {
	api.create.start(async (ctx, next) => {
		ctx.keys("foo", "2");

		await next();
	});

	api.create.process(ctx => {
		assert.strictEqual(ctx.keys("foo"), "2", `foo !== '2'`);
	});

	api.create.error(ctx => {
		throw ctx.ex();
	});
};
