const assert = require("assert");

/* istanbul ignore next */
module.exports = api => {
	api.create.start(async ctx => {
		ctx.scopedKeys("foo", "2");
	});

	api.create.process(ctx => {
		assert.strictEqual(ctx.scopedKeys("foo"), "1", `foo !== '2'`);
	});

	api.create.error(ctx => {
		const ex = ctx.ex();
		assert.strictEqual(ex.message, "foo !== '2'");
	});
};
