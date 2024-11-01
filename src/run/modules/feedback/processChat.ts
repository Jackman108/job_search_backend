// src/processVacancy.js
import { SELECTORS, SELECTORS_CHAT, TIMEOUTS } from '../../../constants.js';
import { ProcessChatParams, GetFeedbackParams } from '../../../interface/interface.js';
import { saveChatFeedback } from '../../../services/chatService.js';
import { extractFeedbackData } from '../../../utils/chatUtils.js';

export async function processChat({
    page,
    chatLinkHandle,
    chatId,
    userId
}: ProcessChatParams): Promise<void> {
    
    await new Promise(r => setTimeout(r, TIMEOUTS.SHORT));
    await page.screenshot({ path: 'screenshot-unknown.png' });
    await chatLinkHandle.click();

    // Получаем все элементы с нужными селекторами и выбираем последний
    const vacancyUrlHandles = await page.$$(SELECTORS_CHAT.VACANCY_URL);
    const statusHandles = await page.$$(SELECTORS_CHAT.RESPONSE_STATUS);
    const textHandles = await page.$$(SELECTORS_CHAT.CHAT_TEXT);
    const dateHandles = await page.$$(SELECTORS_CHAT.CHAT_DATE);
    const timeHandles = await page.$$(SELECTORS_CHAT.CHAT_TIME);

    const vacancyUrlHandle = vacancyUrlHandles?.at(-1);
    const statusHandle = statusHandles?.at(-1);
    const textHandle = textHandles?.at(-1);
    const dateHandle = dateHandles?.at(-1);
    const timeHandle = timeHandles?.at(-1);

    const url_vacancy = vacancyUrlHandle ? await page.evaluate(el => (el as HTMLAnchorElement).href, vacancyUrlHandle) : '';
    const response_status = statusHandle ? await page.evaluate(el => (el as HTMLElement).innerText.trim(), statusHandle) : '';
    const feedback_text = textHandle ? await page.evaluate(el => (el as HTMLElement).innerText.trim(), textHandle) : '';
    const feedback_date = dateHandle ? await page.evaluate(el => (el as HTMLElement).innerText.trim(), dateHandle) : '';
    const feedback_time = timeHandle ? await page.evaluate(el => (el as HTMLElement).innerText.trim(), timeHandle) : '';

    const newData = await extractFeedbackData({ userId, chatId, url_vacancy, response_status, feedback_text, feedback_date, feedback_time });
    await saveChatFeedback(newData, userId);
    console.log(`The Chat with ID ${newData.id} is saved with flag ${newData.response_status}`);
};
