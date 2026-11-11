/** Empty DB/list reads are a valid resource state → REST 200 + []. */
export function asListResult<T>(rows: T[] | null | undefined): T[] {
    return rows ?? [];
}
