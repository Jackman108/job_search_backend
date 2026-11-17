/**
 * Port: resolve HH login secrets at job runtime without storing them in `.hh-jobs/`.
 * Wired by the API composition root (`createProcessJobDeps`).
 */
export interface HhCredentials {
    email: string;
    password: string;
}

export interface CredentialsRepo {
    /** Decrypt and return first matching HH login for the user (prefer email when provided). */
    getDecryptedByUserId(userId: string, email?: string): Promise<HhCredentials | null>;
}
