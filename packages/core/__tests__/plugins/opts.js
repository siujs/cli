const assert = require("assert");

/* istanbul ignore next */
module.exports = api => {
	api.create.process(ctx => {
		assert.strictEqual(ctx.opts("foo"), "2", `opts.foo!=='2'`);
	});

	api.create.error(ctx => {
		const ex = ctx.ex();

		assert.strictEqual(ex.message, "opts.foo!=='2'");
	});

	api.build.process(ctx => {
		const opts = ctx.opts();

		assert.strictEqual(opts.foo, "1", `opts.foo!=='1'`);
		assert.strictEqual(opts.bar, "2", `opts.bar!=='2'`);
	});
};
