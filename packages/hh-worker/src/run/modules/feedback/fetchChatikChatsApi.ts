import { Page } from 'puppeteer';
import type { ChatListMeta } from './getChatListMeta.js';

type ApiChatRow = {
    id?: string | number;
    display?: { title?: string; subtitle?: string };
    lastMessage?: { text?: string };
    messages?: { last?: { body?: { text?: { content?: string } }; text?: string } };
};

/**
 * Full chat list via Chatik JSON API (paginated). Complements DOM virtualization.
 * Status often missing here — caller merges with list DOM / negotiations page.
 */
export async function fetchChatikChatsApi(page: Page, maxPages = 8): Promise<ChatListMeta[]> {
    const rows = await page
        .evaluate(async (pages) => {
            const collected: Array<{
                chatId: number;
                href: string;
                title_vacancy: string;
                title_company: string;
                statusRaw: string;
                previewText: string;
            }> = [];

            const pushItems = (items: ApiChatRow[], resources: Record<string, unknown>) => {
                const vacancies = (resources?.vacancies || {}) as Record<
                    string,
                    { name?: string; id?: number | string }
                >;
                const employers = (resources?.employers || {}) as Record<string, { name?: string }>;
                const negotiations = (resources?.negotiations || {}) as Record<
                    string,
                    { applicant_state?: { id?: string; name?: string }; state?: { id?: string; name?: string } }
                >;

                for (const item of items) {
                    const chatId = Number(item.id);
                    if (!Number.isFinite(chatId) || chatId <= 0) continue;

                    let title = item.display?.title || '';
                    let company = item.display?.subtitle || '';
                    let statusRaw = '';

                    // Prefer negotiation state from resources when present.
                    for (const neg of Object.values(negotiations)) {
                        const st = neg?.applicant_state || neg?.state;
                        if (st?.name) statusRaw = st.name;
                        if (st?.id) {
                            if (/interview|invitation/i.test(st.id)) statusRaw = st.name || 'Собеседование';
                            if (/discard/i.test(st.id)) statusRaw = st.name || 'Отказ';
                            if (/response/i.test(st.id) && !statusRaw) statusRaw = st.name || 'Отклик на вакансию';
                        }
                    }

                    for (const v of Object.values(vacancies)) {
                        if (v?.name && !title) title = v.name;
                    }
                    for (const e of Object.values(employers)) {
                        if (e?.name && !company) company = e.name;
                    }

                    const preview =
                        item.lastMessage?.text ||
                        item.messages?.last?.body?.text?.content ||
                        item.messages?.last?.text ||
                        '';

                    collected.push({
                        chatId,
                        href: `https://chatik.hh.ru/chat/${chatId}`,
                        title_vacancy: title,
                        title_company: company,
                        statusRaw,
                        previewText: String(preview).slice(0, 500),
                    });
                }
            };

            for (let pageNum = 0; pageNum < pages; pageNum++) {
                const urls = [
                    `https://chatik.hh.ru/chatik/api/chats?page=${pageNum}&per_page=20`,
                    `/chatik/api/chats?page=${pageNum}&per_page=20`,
                ];
                let data: Record<string, unknown> | null = null;
                for (const url of urls) {
                    try {
                        const res = await fetch(url, {
                            credentials: 'include',
                            headers: { Accept: 'application/json' },
                        });
                        if (!res.ok) continue;
                        data = (await res.json()) as Record<string, unknown>;
                        break;
                    } catch {
                        /* try next url */
                    }
                }
                if (!data) break;

                const chatsBlock = (data.chats || data) as Record<string, unknown>;
                const items = (chatsBlock.items || chatsBlock.chats || data.items || []) as ApiChatRow[];
                const resources = (data.resources || {}) as Record<string, unknown>;
                if (!Array.isArray(items) || items.length === 0) break;
                pushItems(items, resources);

                const hasNext =
                    chatsBlock.has_next_page === true ||
                    (typeof chatsBlock.pages === 'number' && pageNum + 1 < Number(chatsBlock.pages));
                if (!hasNext && items.length < 20) break;
            }

            return collected;
        }, maxPages)
        .catch((err) => {
            console.error('fetchChatikChatsApi failed:', err);
            return [] as ChatListMeta[];
        });

    return rows;
}
