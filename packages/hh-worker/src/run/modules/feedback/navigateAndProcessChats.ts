import { HH_SCRAPE, TIMEOUTS } from '@config';
import { navigateAndProcessChats } from '@interface';
import { isStopped, mapFeedbackStatus, stop } from '@utils';
import { expandChatList } from './scrollChatList.js';
import { getChatListMeta, type ChatListMeta } from './getChatListMeta.js';
import { processChat } from './processChat.js';

function mergeMeta(into: Map<number, ChatListMeta>, rows: ChatListMeta[]): void {
    for (const row of rows) {
        const prev = into.get(row.chatId);
        if (!prev) {
            into.set(row.chatId, row);
            continue;
        }
        // Prefer a card that already carries a decisive status.
        const prevRank = statusRank(prev.statusRaw);
        const nextRank = statusRank(row.statusRaw);
        if (nextRank < prevRank || (!prev.title_vacancy && row.title_vacancy)) {
            into.set(row.chatId, { ...prev, ...row });
        }
    }
}

function statusRank(raw: string): number {
    const s = mapFeedbackStatus(raw);
    if (s === 'Приглашение') return 0;
    if (s === 'Отказ') return 1;
    if (s === 'Резюме просмотрено') return 2;
    return 3;
}

export async function navigateAndProcessChats({
    userId,
    page,
    browser,
    feedbackRepo,
}: navigateAndProcessChats): Promise<void> {
    const maxChats = HH_SCRAPE.MAX_FEEDBACK_CHATS;
    const metas = new Map<number, ChatListMeta>();

    try {
        const chatsFromDb = await feedbackRepo.getChatFeedback(userId);
        console.log(`Feedback refresh: ${chatsFromDb.length} rows already in DB; re-syncing chat list statuses`);
    } catch (err) {
        console.error(`Error retrieving chats for user ${userId}: ${err}`);
        throw err instanceof Error ? err : new Error(String(err));
    }

    // Scroll sidebar until card set stabilizes — statuses live on the cards.
    let stable = 0;
    for (let i = 0; i < 12 && stable < 2; i++) {
        if (isStopped()) {
            await stop(browser);
            return;
        }
        await expandChatList(page, 2);
        const before = metas.size;
        mergeMeta(metas, await getChatListMeta(page));
        stable = metas.size === before ? stable + 1 : 0;
        await new Promise((r) => setTimeout(r, TIMEOUTS.SHORT));
    }

    const list = [...metas.values()].slice(0, maxChats);
    console.log(`Chat list metas collected: ${list.length} (cap=${maxChats})`);

    // Fast path: persist status/title from list so UI updates even if open fails.
    for (const meta of list) {
        if (isStopped()) {
            await stop(browser);
            return;
        }
        const status = mapFeedbackStatus(meta.statusRaw);
        try {
            await feedbackRepo.saveChatFeedback(
                {
                    id: meta.chatId,
                    vacancy_id: 0,
                    feedback_text: meta.previewText || '',
                    feedback_date: new Date(),
                    response_status: status,
                    title_vacancy: meta.title_vacancy || undefined,
                    title_company: meta.title_company || undefined,
                },
                userId,
            );
            console.log(`List-sync chat ${meta.chatId} → ${status}`);
        } catch (err) {
            console.error(`List-sync failed for ${meta.chatId}:`, err);
        }
    }

    // Enrich with vacancy URL / letter text by opening each chat via URL (no stale handles).
    let opened = 0;
    for (const meta of list) {
        if (isStopped()) {
            await stop(browser);
            return;
        }
        try {
            await processChat({
                page,
                chatLinkHandle: null,
                chatId: meta.chatId,
                userId,
                feedbackRepo,
                listMeta: meta,
            });
            opened += 1;
        } catch (err) {
            console.error(`Error processing feedback with ID ${meta.chatId}:`, err);
        }
    }

    console.log(`Feedback refresh finished: list=${list.length} opened=${opened}`);
}
