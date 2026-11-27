import { Page } from 'puppeteer';
import { SELECTORS_CHAT } from '@market-hunter/hh-worker/config';

export type ChatListMeta = {
    chatId: number;
    href: string;
    title_vacancy: string;
    title_company: string;
    /** Raw status label from the chat list card (Отказ / Собеседование / …). */
    statusRaw: string;
    previewText: string;
};

/**
 * Magritte shows negotiation state on the left chat card (Отказ / Собеседование / Отклик…),
 * not inside chat-bubble-title. Read it from the list.
 */
export async function getChatListMeta(page: Page): Promise<ChatListMeta[]> {
    return page.$$eval(SELECTORS_CHAT.CHAT_CARD, (els) => {
        const STATUS_RE =
            /(Отказ|Собеседование|Приглашение|Отклик на вакансию|Резюме просмотрено|Не рассмотрен|На рассмотрении|Вакансия в архиве|В архиве)/i;
        const TIME_RE = /^(\d{1,2}:\d{2}|сегодня|вчера|пн|вт|ср|чт|пт|сб|вс|\d{1,2}\s+\S+)$/i;

        return els
            .map((el) => {
                const a = el as HTMLAnchorElement;
                const href = a.href || '';
                const chatId = Number(href.match(/\/chat\/(\d+)/)?.[1]) || 0;
                const lines = (a.innerText || '')
                    .split(/\n+/)
                    .map((s) => s.replace(/\s+/g, ' ').trim())
                    .filter(Boolean);

                let statusRaw = '';
                let title_vacancy = '';
                let title_company = '';
                const other: string[] = [];

                for (const line of lines) {
                    if (STATUS_RE.test(line)) {
                        statusRaw = line.match(STATUS_RE)?.[1] || line;
                        continue;
                    }
                    if (TIME_RE.test(line) || /^\d+$/.test(line)) continue;
                    other.push(line);
                }

                title_vacancy = other[0] || '';
                title_company = other[1] || '';
                const previewText = other.slice(2).join(' ').slice(0, 500);

                return { chatId, href, title_vacancy, title_company, statusRaw, previewText };
            })
            .filter((row) => row.chatId > 0);
    });
}
