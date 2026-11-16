import { HH_SCRAPE, SELECTORS_CHAT, TIMEOUTS } from '@config';
import { navigateAndProcessChats } from '@interface';
import { isStopped, mapFeedbackStatus, sanitizeVacancyTitle, stop } from '@utils';
import { expandChatList } from './scrollChatList.js';
import { fetchChatikChatsApi } from './fetchChatikChatsApi.js';
import { getChatListMeta, type ChatListMeta } from './getChatListMeta.js';
import { processChat } from './processChat.js';
import { syncNegotiationsInvites } from './syncNegotiationsInvites.js';

function statusRank(raw: string): number {
    const s = mapFeedbackStatus(raw);
    if (s === 'Приглашение') return 0;
    if (s === 'Отказ') return 1;
    if (s === 'Резюме просмотрено') return 2;
    return 3;
}

function mergeMeta(into: Map<number, ChatListMeta>, rows: ChatListMeta[]): void {
    for (const row of rows) {
        if (!row.chatId) continue;
        const cleaned: ChatListMeta = {
            ...row,
            title_vacancy: sanitizeVacancyTitle(row.title_vacancy),
            title_company: (row.title_company || '').trim(),
        };
        const prev = into.get(cleaned.chatId);
        if (!prev) {
            into.set(cleaned.chatId, cleaned);
            continue;
        }
        const prevRank = statusRank(prev.statusRaw);
        const nextRank = statusRank(cleaned.statusRaw);
        into.set(cleaned.chatId, {
            chatId: cleaned.chatId,
            href: cleaned.href || prev.href,
            title_vacancy: cleaned.title_vacancy || prev.title_vacancy,
            title_company: cleaned.title_company || prev.title_company,
            statusRaw: nextRank < prevRank ? cleaned.statusRaw : prev.statusRaw || cleaned.statusRaw,
            previewText: cleaned.previewText || prev.previewText,
        });
    }
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
        console.log(`Feedback refresh: ${chatsFromDb.length} rows already in DB`);
    } catch (err) {
        console.error(`Error retrieving chats for user ${userId}: ${err}`);
        throw err instanceof Error ? err : new Error(String(err));
    }

    // 1) Chatik JSON API — full pages, not just virtualized DOM.
    if (!isStopped()) {
        const apiRows = await fetchChatikChatsApi(page);
        mergeMeta(metas, apiRows);
        console.log(`Chatik API chats: ${apiRows.length}`);
    }

    // 2) DOM sidebar (has Отказ/Собеседование labels API may omit).
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
    console.log(`After sidebar merge: ${metas.size} chats`);

    // 3) Negotiations «interview/invitations» — source for invites missing from sidebar.
    if (!isStopped()) {
        const inviteRows = await syncNegotiationsInvites(page);
        mergeMeta(metas, inviteRows);
        // Rows without chatId: still persist via vacancy title later if we can resolve.
        for (const row of inviteRows.filter((r) => !r.chatId && r.title_vacancy)) {
            console.log(`Invite without chatId (title-only): ${row.title_vacancy}`);
        }
        console.log(`After negotiations invites: ${metas.size} chats`);
        // Return to chatik for open/enrich.
        await page
            .goto(SELECTORS_CHAT.CHAT_URL, { waitUntil: 'domcontentloaded', timeout: TIMEOUTS.LONG })
            .catch(() => undefined);
    }

    const list = [...metas.values()].slice(0, maxChats);
    console.log(`Chat metas ready: ${list.length} (cap=${maxChats})`);

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
                    title_vacancy: sanitizeVacancyTitle(meta.title_vacancy) || undefined,
                    title_company: meta.title_company || undefined,
                },
                userId,
            );
            console.log(`List-sync chat ${meta.chatId} → ${status}`);
        } catch (err) {
            console.error(`List-sync failed for ${meta.chatId}:`, err);
        }
    }

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
