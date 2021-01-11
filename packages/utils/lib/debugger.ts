import debug from "debug";

const DEBUG = process.env.DEBUG;

const DEBUG_Filter = process.env.SIU_DEBUG_FILER;

/**
 *
 * Create debugger
 *
 * @param ns namespace string
 * @param onlyWhenFocused [optional] default: true
 */
/* istanbul ignore next */
export function createDebugger(ns: string, onlyWhenFocused: boolean | string = false) {
	const log = debug(ns);

	const focus = typeof onlyWhenFocused === "string" ? onlyWhenFocused : ns;

	return (msg: string, ...args: any[]) => {
		if (DEBUG_Filter && !msg.includes(DEBUG_Filter)) return;
		if (onlyWhenFocused && !DEBUG?.includes(focus)) return;
		log(msg, ...args);
	};
}
