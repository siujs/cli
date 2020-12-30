/* istanbul ignore next */
module.exports = api => {
	api.create.start(async ctx => {
		ctx.keys("foo", "2");
	});

	api.create.process(() => {
		throw new Error("next start=>process");
	});

	api.create.error(ctx => {
		throw ctx.ex();
	});
};
