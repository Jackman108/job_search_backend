export const getFromCache = <T>(cache: Map<string, T | null>, key: string): T | null => {
    const value = cache.get(key);
    return value === undefined ? null : value;
};

export const setToCache = <T>(cache: Map<string, T | null>, key: string, value: T | null): void => {
    cache.set(key, value);
};

export const deleteFromCache = (cache: Map<string, any>, key: string): void => {
    cache.delete(key);
};
