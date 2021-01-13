const camelizeRE = /-(\w)/g;

/**
 *
 * '-a' to 'A'
 * 'a-b' to `aB`
 *
 * @param str input string
 * @param isFirstUpper make first char tobe Upper
 */
export function camelize(str: string, isFirstUpper?: boolean): string {
	str = str.replace(camelizeRE, (_, c) => c.toUpperCase());

	str = isFirstUpper ? str[0].toUpperCase() + str.substring(1) : str;

	return str;
}
