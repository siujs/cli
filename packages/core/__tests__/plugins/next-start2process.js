/* istanbul ignore next */
module.exports = api => {
	api.create.start(async (ctx, next) => {
		ctx.keys("foo", "2");
		await next();
	});

	api.create.process(() => {
		throw new Error("next start=>process");
	});

	api.create.error(ctx => {
		throw ctx.ex();
	});
};
