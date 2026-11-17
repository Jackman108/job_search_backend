import { deriveUserRank, getUserProfile } from '../../profile/index.js';
import { notificationsConfig } from '../module.config.js';
import type { AppNotification } from '../domain/types.js';
import {
    countUnread,
    ensureNotificationsTable,
    markRead,
    selectNotifications,
    upsertDailyNotification,
} from '../infra/notificationRepo.js';

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

    await upsertDailyNotification(userId, title, body, todayKey());
}

export async function listNotifications(
    userId: string,
    limit = notificationsConfig.defaultListLimit,
): Promise<AppNotification[]> {
    await ensureDailyNotification(userId);
    return selectNotifications(userId, limit);
}

export async function markNotificationRead(userId: string, notificationId: string): Promise<void> {
    await ensureNotificationsTable();
    await markRead(userId, notificationId);
}

export async function unreadNotificationCount(userId: string): Promise<number> {
    await ensureDailyNotification(userId);
    return countUnread(userId);
}
