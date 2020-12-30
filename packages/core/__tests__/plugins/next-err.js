/* istanbul ignore next */
module.exports = api => {
	api.create.start(async () => {
		throw new Error("next-err");
	});

	api.create.error(ctx => {
		throw ctx.ex();
	});
};
