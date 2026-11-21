import { executeQuery } from '../../../utils/index.js';
import type { AppNotification } from '../domain/types.js';

/** Safety net when migrations were not run on a fresh local DB. */
export async function ensureNotificationsTable(): Promise<void> {
    await executeQuery(`
        CREATE TABLE IF NOT EXISTS app_notifications (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            kind VARCHAR(64) NOT NULL,
            title VARCHAR(255) NOT NULL,
            body TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            read_at TIMESTAMPTZ,
            day_key DATE NOT NULL DEFAULT CURRENT_DATE,
            UNIQUE (user_id, kind, day_key)
        );
    `);
    await executeQuery(`
        CREATE INDEX IF NOT EXISTS app_notifications_user_created
        ON app_notifications (user_id, created_at DESC);
    `);
}

export async function upsertDailyNotification(
    userId: string,
    title: string,
    body: string,
    dayKey: string,
): Promise<void> {
    await executeQuery(
        `
        INSERT INTO app_notifications (user_id, kind, title, body, day_key)
        VALUES ($1, 'daily', $2, $3, $4::date)
        ON CONFLICT (user_id, kind, day_key)
        DO UPDATE SET title = EXCLUDED.title, body = EXCLUDED.body;
        `,
        [userId, title, body, dayKey],
    );
}

export async function selectNotifications(userId: string, limit: number): Promise<AppNotification[]> {
    const rows = await executeQuery<AppNotification>(
        `
        SELECT id::text, user_id::text, kind, title, body, created_at::text, read_at::text
        FROM app_notifications
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2;
        `,
        [userId, limit],
    );
    return rows.length ? rows : [];
}

export async function markRead(userId: string, notificationId: string): Promise<void> {
    await executeQuery(
        `
        UPDATE app_notifications
        SET read_at = NOW()
        WHERE id = $1::uuid AND user_id = $2 AND read_at IS NULL;
        `,
        [notificationId, userId],
    );
}

export async function countUnread(userId: string): Promise<number> {
    const rows = await executeQuery<{ count: string | number }>(
        `
        SELECT COUNT(*)::int AS count
        FROM app_notifications
        WHERE user_id = $1 AND read_at IS NULL;
        `,
        [userId],
    );
    return Number(rows[0]?.count ?? 0);
}
