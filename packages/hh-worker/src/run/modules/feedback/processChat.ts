import { SELECTORS_CHAT } from '@config';
import { ProcessChatParams } from '@interface';
import { extractFeedbackData, isStopped, pickBestFeedbackStatus } from '@utils';

export async function processChat({
    page,
    chatLinkHandle,
    chatId,
    userId,
    feedbackRepo,
}: ProcessChatParams): Promise<void> {
    if (isStopped()) {
        console.log('Processing stopped before processing chat:', chatId);
        return;
    }

    await page.screenshot({ path: 'screenshot-unknown.png' });
    await chatLinkHandle.click();
    await page.waitForSelector(SELECTORS_CHAT.VACANCY_URL);

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
    const title_vacancy = vacancyUrlHandle
        ? await page.evaluate((el) => (el as HTMLElement).innerText.trim(), vacancyUrlHandle)
        : '';
    const title_company = await page
        .$$eval(SELECTORS_CHAT.COMPANY_NAME, (els) => {
            for (const el of els) {
                const t = ((el as HTMLElement).innerText || '').trim();
                if (t) return t;
            }
            return '';
        })
        .catch(() => '');
    const response_status = pickBestFeedbackStatus(statusTitles);
    const feedback_text = textHandle
        ? await page.evaluate((el) => (el as HTMLElement).innerText.trim(), textHandle)
        : '';
    const feedback_date = dateHandle
        ? await page.evaluate((el) => (el as HTMLElement).innerText.trim(), dateHandle)
        : 'N/A';
    const feedback_time = timeHandle
        ? await page.evaluate((el) => (el as HTMLElement).innerText.trim(), timeHandle)
        : '00:00';

    const newData = await extractFeedbackData({
        chatId,
        url_vacancy,
        response_status,
        feedback_text,
        feedback_date,
        feedback_time,
        title_vacancy,
        title_company,
    });

    await feedbackRepo.saveChatFeedback(newData, userId);
    console.log(`The Chat with ID ${newData.id} is saved with flag ${newData.response_status}`);
}
