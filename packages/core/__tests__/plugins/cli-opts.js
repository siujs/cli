module.exports = api => {
	api.create.cli(option => {
		option("-f, --foo <foo>", "Foo", "1");
	});
};
