import { executeQuery } from '@utils';
import { deriveUserRank } from '../../utils/deriveUserRank.js';
import { getUserProfile } from '../auth/profileService.js';

export type AppNotification = {
    id: string;
    user_id: string;
    kind: string;
    title: string;
    body: string;
    created_at: string;
    read_at: string | null;
};

async function ensureNotificationsTable(): Promise<void> {
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

function todayKey(): string {
    return new Date().toISOString().slice(0, 10);
}

/** Ensure one daily engagement note exists for today (idempotent). */
export async function ensureDailyNotification(userId: string): Promise<void> {
    await ensureNotificationsTable();
    const profile = await getUserProfile(userId);
    const success = Number(profile.successful_responses_count) || 0;
    const spins = Number(profile.spin_count) || 0;
    const rank = deriveUserRank(success, spins);
    const remain = rank.nextSuccessfulResponses != null ? Math.max(0, rank.nextSuccessfulResponses - success) : 0;
    const nextHint = rank.nextTitle
        ? `До ранга «${rank.nextTitle}» осталось успешных откликов: ${remain}.`
        : 'Вы на максимальном ранге — так держать!';

    const title = `Ежедневный прогресс · ${rank.title}`;
    const body = [
        `Ранг: ${rank.title} (ур. ${rank.level}), прогресс ${rank.progressPct}%.`,
        `Успешные отклики: ${success}, прогоны: ${spins}.`,
        nextHint,
        'Обновите статусы откликов и сделайте новый прогон — это поднимает ранг.',
    ].join(' ');

    await executeQuery(
        `
        INSERT INTO app_notifications (user_id, kind, title, body, day_key)
        VALUES ($1, 'daily', $2, $3, $4::date)
        ON CONFLICT (user_id, kind, day_key)
        DO UPDATE SET title = EXCLUDED.title, body = EXCLUDED.body;
        `,
        [userId, title, body, todayKey()],
    );
}

export async function listNotifications(userId: string, limit = 30): Promise<AppNotification[]> {
    await ensureDailyNotification(userId);
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

export async function markNotificationRead(userId: string, notificationId: string): Promise<void> {
    await ensureNotificationsTable();
    await executeQuery(
        `
        UPDATE app_notifications
        SET read_at = NOW()
        WHERE id = $1::uuid AND user_id = $2 AND read_at IS NULL;
        `,
        [notificationId, userId],
    );
}

export async function unreadNotificationCount(userId: string): Promise<number> {
    await ensureDailyNotification(userId);
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
