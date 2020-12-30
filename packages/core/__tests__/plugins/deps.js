/* istanbul ignore next */
module.exports = api => {
	api.deps.start(async () => {
		throw new Error("deps called");
	});

	api.deps.error(ctx => {
		throw ctx.ex();
	});
};
