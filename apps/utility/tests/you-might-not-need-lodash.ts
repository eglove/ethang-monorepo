export const compact = <T>(array: T[]): T[] => {
	return array.filter(x => !!x);
}

export const concat = <T>(original: T[], ...rest: T[][]): T[] => {
	return original.concat(...rest);
}

export const difference = <T>(arr1: T[], arr2: T[]): T[] => {
	return arr1.filter(x => !arr2.includes(x));
}

export const get = <T>(obj: Object, path: string | string[], defValue: T): T | undefined => {
	if (!path) return undefined

	const pathArray = Array.isArray(path) ? path : path.match(/([^[.\]])+/g)

	// @ts-expect-error forgets to check above results
	const result = pathArray.reduce(
		// @ts-expect-error no acceptable object definiitions
		(prevObj, key) => prevObj && prevObj[key],
		obj
	)

	// @ts-expect-error no real types
	return result === undefined ? defValue : result
}
