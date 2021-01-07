import ora, { Options, Ora } from "ora";

export function startSpinner(text: Options | string): Ora {
	return ora(text).start();
}
