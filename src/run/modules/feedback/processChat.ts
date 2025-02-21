// src/processVacancy.js
import {SELECTORS_CHAT} from '../../../constants.js';
import {ProcessChatParams} from '../../../interface/interface.js';
import {saveChatFeedback} from '../../../services/feedbackService.js';
import {extractFeedbackData} from '../../../utils/feedbackUtils.js';
import {isStopped} from "../../../utils/stopManager.js";

export async function processChat({
                                      page,
                                      chatLinkHandle,
                                      chatId,
                                      userId
                                  }: ProcessChatParams): Promise<void> {

    if (isStopped()) {
        console.log('Processing stopped before processing chat:', chatId);
        return;
    }

    await page.screenshot({path: 'screenshot-unknown.png'});
    await chatLinkHandle.click();
    await page.waitForSelector(SELECTORS_CHAT.VACANCY_URL);

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
    const feedback_date = dateHandle ? await page.evaluate(el => (el as HTMLElement).innerText.trim(), dateHandle) : 'N/A';
    const feedback_time = timeHandle ? await page.evaluate(el => (el as HTMLElement).innerText.trim(), timeHandle) : '00:00';


    const newData = await extractFeedbackData({
        chatId,
        url_vacancy,
        response_status,
        feedback_text,
        feedback_date,
        feedback_time
    });

    await saveChatFeedback(newData, userId);
    console.log(`The Chat with ID ${newData.id} is saved with flag ${newData.response_status}`);

}
