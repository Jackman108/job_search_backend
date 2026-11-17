import { SELECTORS_CHAT, TIMEOUTS } from '@market-hunter/hh-worker/config';
import { ProcessChatParams } from '@market-hunter/hh-worker/types';
import {
    extractFeedbackData,
    isStopped,
    mapFeedbackStatus,
    pickBestFeedbackStatus,
    sanitizeVacancyTitle,
} from '@market-hunter/hh-worker/lib';
import type { ChatListMeta } from './getChatListMeta.js';

type ProcessChatWithMeta = ProcessChatParams & {
    listMeta?: ChatListMeta;
};

/**
 * Open chat by URL (avoids stale ElementHandle after list virtualization)
 * and merge list-card status (source of truth on Magritte) with bubble text.
 */
export async function processChat({
    page,
    chatId,
    userId,
    feedbackRepo,
    listMeta,
}: ProcessChatWithMeta): Promise<void> {
    if (isStopped()) {
        console.log('Processing stopped before processing chat:', chatId);
        return;
    }

    const chatUrl = listMeta?.href || `${SELECTORS_CHAT.CHAT_URL.replace(/\?.*$/, '')}/chat/${chatId}`;
    await page.goto(chatUrl, { waitUntil: 'domcontentloaded', timeout: TIMEOUTS.LONG }).catch(async () => {
        // Fallback: click a fresh card handle if goto failed (SPA routing).
        const sel = `a[data-qa="chatik-open-chat-${chatId}"], a[data-qa^="chatik-open-chat-${chatId}"]`;
        const handle = await page.$(sel);
        if (handle) await handle.click();
    });

    await page.waitForSelector(SELECTORS_CHAT.VACANCY_URL, { timeout: TIMEOUTS.SEARCH }).catch(() => null);
    await new Promise((r) => setTimeout(r, TIMEOUTS.SHORT));

    const vacancyUrlHandles = await page.$$(SELECTORS_CHAT.VACANCY_URL);
    const statusTitles = await page
        .$$eval(SELECTORS_CHAT.RESPONSE_STATUS, (els) =>
            els.map((el) => ((el as HTMLElement).innerText || '').trim()).filter(Boolean),
        )
        .catch(() => [] as string[]);
    const textHandles = await page.$$(SELECTORS_CHAT.CHAT_TEXT);
    const dateHandles = await page.$$(SELECTORS_CHAT.CHAT_DATE);
    const timeHandles = await page.$$(SELECTORS_CHAT.CHAT_TIME);

    const vacancyUrlHandle = vacancyUrlHandles?.at(-1);
    const textHandle = textHandles?.at(-1);
    const dateHandle = dateHandles?.at(-1);
    const timeHandle = timeHandles?.at(-1);

    const url_vacancy = vacancyUrlHandle
        ? await page.evaluate((el) => (el as HTMLAnchorElement).href, vacancyUrlHandle)
        : '';
    let title_vacancy = sanitizeVacancyTitle(
        vacancyUrlHandle ? await page.evaluate((el) => (el as HTMLElement).innerText.trim(), vacancyUrlHandle) : '',
    );
    if (!title_vacancy) {
        title_vacancy = sanitizeVacancyTitle(listMeta?.title_vacancy);
    }
    let title_company = await page
        .$$eval(SELECTORS_CHAT.COMPANY_NAME, (els) => {
            for (const el of els) {
                const t = ((el as HTMLElement).innerText || '').trim();
                if (t) return t;
            }
            return '';
        })
        .catch(() => '');
    if (!title_company) title_company = listMeta?.title_company || '';

    const apiStateName = await page
        .evaluate(async (id) => {
            try {
                const res = await fetch(`https://chatik.hh.ru/chatik/api/chat_data?chatId=${id}`, {
                    credentials: 'include',
                    headers: { Accept: 'application/json' },
                });
                if (!res.ok) return '';
                const data = (await res.json()) as {
                    messages?: {
                        items?: Array<{ workflow_transition?: { applicant_state?: { name?: string; id?: string } } }>;
                    };
                };
                const items = data.messages?.items || [];
                for (let i = items.length - 1; i >= 0; i--) {
                    const st = items[i]?.workflow_transition?.applicant_state;
                    if (st?.name || st?.id) return st.name || st.id || '';
                }
            } catch {
                /* ignore */
            }
            return '';
        }, chatId)
        .catch(() => '');

    const feedback_text = textHandle
        ? await page.evaluate((el) => (el as HTMLElement).innerText.trim(), textHandle)
        : listMeta?.previewText || '';

    // Structured statuses first. Letter text only as fallback — reject letters often
    // contain «пригласить» and used to flip Отказ → Приглашение when ranked wrong.
    let response_status = pickBestFeedbackStatus([
        listMeta?.statusRaw || '',
        apiStateName,
        ...statusTitles,
        listMeta?.previewText || '',
    ]);
    if (response_status === 'Не рассмотрен' && feedback_text) {
        response_status = mapFeedbackStatus(feedback_text.slice(0, 500));
    }
    const feedback_date = dateHandle
        ? await page.evaluate((el) => (el as HTMLElement).innerText.trim(), dateHandle)
        : 'сегодня';
    const feedback_time = timeHandle
        ? await page.evaluate((el) => (el as HTMLElement).innerText.trim(), timeHandle)
        : '00:00';

    const newData = await extractFeedbackData({
        chatId,
        url_vacancy,
        response_status,
        feedback_text,
        feedback_date,
        feedback_time: /^\d{1,2}:\d{2}$/.test(feedback_time) ? feedback_time : '00:00',
        title_vacancy,
        title_company,
    });

    // Guarantee mapped label even if extract path got empty raw somehow.
    newData.response_status = mapFeedbackStatus(newData.response_status || response_status);

    await feedbackRepo.saveChatFeedback(newData, userId);
    console.log(`The Chat with ID ${newData.id} is saved with flag ${newData.response_status}`);
}
