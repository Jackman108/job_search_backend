import { HH_SCRAPE, TIMEOUTS } from '@config';
import { FeedbackWithResponse, navigateAndProcessChats } from '@interface';
import { isStopped, stop } from '@utils';
import { expandChatList } from './scrollChatList.js';
import { getChats } from './getChats.js';
import { processChat } from './processChat.js';

export async function navigateAndProcessChats({
    userId,
    page,
    browser,
    feedbackRepo,
}: navigateAndProcessChats): Promise<void> {
    const maxChats = HH_SCRAPE.MAX_FEEDBACK_CHATS;
    /** Chats opened this run — allow re-read of rows already in DB so statuses update. */
    const processedThisRun = new Set<number>();

    try {
        const chatsFromDb = await feedbackRepo.getChatFeedback(userId);
        console.log(`Feedback refresh: ${chatsFromDb.length} rows already in DB; will re-open visible chats`);
    } catch (err) {
        console.error(`Error retrieving chats for user ${userId}: ${err}`);
        throw err instanceof Error ? err : new Error(String(err));
    }

    await expandChatList(page);

    let idleRounds = 0;
    while (processedThisRun.size < maxChats && idleRounds < 3) {
        if (isStopped()) {
            await stop(browser);
            return;
        }

        try {
            let chats: FeedbackWithResponse[] = await getChats(page);
            chats = chats.filter((data) => data.chatId && !processedThisRun.has(data.chatId));

            if (chats.length === 0) {
                const before = processedThisRun.size;
                await expandChatList(page, 3);
                chats = (await getChats(page)).filter((data) => data.chatId && !processedThisRun.has(data.chatId));
                if (chats.length === 0) {
                    idleRounds += 1;
                    console.log(`No new chats after scroll (idle=${idleRounds})`);
                    continue;
                }
                if (processedThisRun.size === before && chats.length === 0) {
                    idleRounds += 1;
                }
            } else {
                idleRounds = 0;
            }

            console.log(`Processing ${chats.length} chats (done=${processedThisRun.size}/${maxChats})`);

            for (let i = 0; i < chats.length; i++) {
                if (processedThisRun.size >= maxChats) break;
                const { chatId, chatLinkHandle } = chats[i];

                await page.screenshot({ path: 'screenshot-chats.png' });
                if (isStopped()) {
                    await stop(browser);
                    return;
                }

                await new Promise((r) => setTimeout(r, TIMEOUTS.SHORT));
                try {
                    processedThisRun.add(chatId);
                    if (chatLinkHandle) {
                        await processChat({ page, chatLinkHandle, chatId, userId, feedbackRepo });
                    } else {
                        console.error(`Feedback response for ID ${chatId} is null.`);
                    }
                } catch (err) {
                    console.error(`Error processing feedback with ID ${chatId}:`, err);
                }
            }
        } catch (err) {
            console.error('Error during chat list processing:', err);
            idleRounds += 1;
        }
    }

    console.log(`Feedback refresh finished: opened ${processedThisRun.size} chats`);
}
