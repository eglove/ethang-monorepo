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

    const result = pathArray.reduce(
        (prevObj, key) => prevObj && prevObj[key],
        obj
    )

    return result === undefined ? defValue : result
}

export const differenceBy = (arr1, arr2, iteratee) => {
    if (typeof iteratee === 'string') {
        const prop = iteratee
        iteratee = item => item[prop]
    }
    return arr1.filter(c => !arr2.map(iteratee).includes(iteratee(c)))
}


export const drop = (arr, n = 1) => arr.slice(n);

export const dropRight = (arr, n = 1) => arr.slice(0, -n || arr.length);

export const fill = (arr, value) => {
    return arr.fill(value);
}