// src/navigateAndProcessVacancies.ts
import { SELECTORS, TIMEOUTS } from '../../../constants.js';
import { ChatData, ChatWithResponse, navigateAndProcessChats } from '../../../interface/interface.js';
import { personalData } from '../../../secrets.js';
import { getFeedbacksForUser } from '../../../services/getFeedbackService.js';
import { isStopped, stop } from '../../../utils/stopManager.js';
import { getChats } from './getChats.js';
import { processChat } from './processChat.js';

export async function navigateAndProcessChats({
    userId,
    page,
    browser
}: navigateAndProcessChats): Promise<void> {

    let currentPage = 0;
    let existingChatsIds: Set<number>;
    const { totalPages } = personalData;

    try {
        const ChatsFromDb = await getFeedbacksForUser(userId);
        existingChatsIds = new Set(ChatsFromDb.map(chat => chat.id));
    } catch (err) {
        console.error(`Error retrieving vacancies for user ${userId}: ${err}`);
        return;
    }

    while (currentPage < totalPages) {
        if (isStopped()) {
            await stop(browser);
            return;
        }
        try {
            console.log(`Processing page ${currentPage + 1} из ${totalPages}`);

            let chats: ChatWithResponse[] = await getChats(page);
            chats = chats.filter(( data ) => data.chatId && !existingChatsIds.has(data.chatId));
            if (chats.length === 0) {
                console.log('chats.length', chats.length);
                break;
            }

            for (let i = 0; i < chats.length; i++) {
                const  {chatId, chatLinkHandle}  = chats[i];
                
                await page.screenshot({ path: 'chats_length.png' });
                if (isStopped()) {
                    await stop(browser);
                    return;
                }

                console.log('chats found', chats.length);

                await new Promise(r => setTimeout(r, TIMEOUTS.SHORT));
                try {
                    if (chatLinkHandle) {
                        await processChat({ page, chatLinkHandle, chatId, userId });
                    } else {
                        console.error(`Vacancy response for ID ${chatId} is null.`);
                    }
                } catch (err) {
                    console.error(`Error processing vacancy with ID ${chatId}:`, err);
                }
            }

            const nextPageButtonHandle = await page.$(SELECTORS.PAGER_NEXT);
            if (nextPageButtonHandle) {
                console.log('Go to the next page.');
                await page.screenshot({ path: 'next_ page.png' });

                await nextPageButtonHandle.click();
                await new Promise(r => setTimeout(r, TIMEOUTS.SHORT));
                currentPage++;
            } else {
                break;
            }

            if (isStopped()) {
                await stop(browser);
                return;
            }
        } catch (err) {
            console.error('Error during page processing:', err);
        }
    }
}
