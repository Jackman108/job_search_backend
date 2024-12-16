// src/navigateAndProcessVacancies.ts
import {TIMEOUTS} from '../../../constants.js';
import {FeedbackWithResponse, navigateAndProcessChats} from '../../../interface/interface.js';
import {personalData} from '../../../secrets.js';
import {getChatFeedback} from '../../../services/feedbackService.js';
import {isStopped, stop} from '../../../utils/stopManager.js';
import {getChats} from './getChats.js';
import {processChat} from './processChat.js';

export async function navigateAndProcessChats({
                                                  userId,
                                                  page,
                                                  browser
                                              }: navigateAndProcessChats): Promise<void> {

    let currentPage = 0;
    let existingChatsIds: Set<number>;
    const {totalPages} = personalData;

    try {
        const ChatsFromDb = await getChatFeedback(userId);
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

            let chats: FeedbackWithResponse[] = await getChats(page);
            chats = chats.filter((data) => data.chatId && !existingChatsIds.has(data.chatId));
            if (chats.length === 0) {
                console.log('chats.length', chats.length);
                break;
            }

            for (let i = 0; i < chats.length; i++) {
                const {chatId, chatLinkHandle} = chats[i];

                await page.screenshot({path: 'screenshot-chats.png'});
                if (isStopped()) {
                    await stop(browser);
                    return;
                }

                console.log('chats found', chats.length);

                await new Promise(r => setTimeout(r, TIMEOUTS.SHORT));
                try {
                    existingChatsIds.add(chatId);
                    if (chatLinkHandle) {
                        await processChat({page, chatLinkHandle, chatId, userId});
                    } else {
                        console.error(`Feedback response for ID ${chatId} is null.`);
                    }
                } catch (err) {
                    console.error(`Error processing feedback with ID ${chatId}:`, err);
                }
            }

        } catch (err) {
            console.error('Error during page processing:', err);
        }
    }
}
