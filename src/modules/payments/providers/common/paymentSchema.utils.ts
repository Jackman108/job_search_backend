import { executeQuery } from '@utils';

/** Cached: auth Prisma shared DB uses `user_id`; legacy backend DDL used `subscription_id`. */
let paymentsKeyedByUserId: boolean | null = null;

export async function isPaymentsKeyedByUserId(): Promise<boolean> {
    if (paymentsKeyedByUserId != null) return paymentsKeyedByUserId;
    const rows = await executeQuery<{ exists: boolean }>(
        `SELECT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'user_id'
        ) AS exists;`,
    );
    paymentsKeyedByUserId = Boolean(rows[0]?.exists);
    return paymentsKeyedByUserId;
}

/** Reset cache (tests). */
export function resetPaymentsSchemaCache(): void {
    paymentsKeyedByUserId = null;
}
