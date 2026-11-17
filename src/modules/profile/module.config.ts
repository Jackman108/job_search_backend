/** User profile / ranks / avatar. */
export const profileConfig = {
    table: 'profiles' as const,
};

export function validateProfileConfig(): void {
    // No required env today.
}
