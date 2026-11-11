/** Brief stage line for detached worker stdout (API parent inherits logs). */
export function stage(step: string, detail?: string): void {
    const suffix = detail ? ` · ${detail}` : '';
    console.log(`[hh] ${step}${suffix}`);
}
