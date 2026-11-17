import { getVacancyAuthByUserId } from '../../search-profile/index.js';

export type HhApplyCredentials = { email: string; password: string };

/**
 * Prefer body credentials; otherwise first saved vacancy_auth row with password.
 * Returns null when nothing usable is available.
 */
export async function resolveHhApplyCredentials(
    userId: string,
    bodyEmail?: string,
    bodyPassword?: string,
): Promise<HhApplyCredentials | null> {
    let email = typeof bodyEmail === 'string' ? bodyEmail.trim() : '';
    let password = typeof bodyPassword === 'string' ? bodyPassword : '';

    if (!email || !password) {
        const auths = await getVacancyAuthByUserId(userId);
        const first = auths.find((a) => a.email && a.password) || auths[0];
        if (first?.email && first?.password) {
            email = email || String(first.email);
            password = password || String(first.password);
        }
    }

    if (!email || !password) {
        return null;
    }
    return { email, password };
}
