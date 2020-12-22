const assert = require("assert");

/* istanbul ignore next */
module.exports = api => {
	api.create.process(ctx => {
		assert.strictEqual(ctx.opts("foo"), "2", `opts.foo!=='2'`);
	});

	api.create.error(ctx => {
		throw ctx.ex();
	});
};
