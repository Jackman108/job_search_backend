// src/getChats.ts
import { Page } from 'puppeteer';
import { SELECTORS_CHAT, TIMEOUTS } from '../../../constants.js';
import { ChatWithResponse, ExtractChatIdParams,  } from '../../../interface/interface.js';
import { extractChatId } from '../../../utils/chatUtils.js';

export async function getChats(page: Page): Promise<ChatWithResponse[]> {
    try {
        await page.screenshot({ path: 'VACANCY_CARD.png' });

        await page.waitForSelector(SELECTORS_CHAT.CHAT_CARD, { timeout: TIMEOUTS.LONG });
        const chats = await page.$$(SELECTORS_CHAT.CHAT_CARD);
        const chatsWithResponse: ChatWithResponse[] = [];
        const visitedIds = new Set<number>();

        for (const chatHandle of chats) {
            const chatLinkHandle = await chatHandle.$(SELECTORS_CHAT.CHAT_CARD);

            const chatUrl =  await page.evaluate(
                el => (el as HTMLAnchorElement).href, 
                chatLinkHandle
                );

            if (chatUrl) { 
                const { chatId } = await extractChatId({ chatUrl });
                if (!visitedIds.has(chatId)) {
                    visitedIds.add(chatId);
                    chatsWithResponse.push({ chatId, chatLinkHandle: chatLinkHandle });
                }
            }           
        }
        return chatsWithResponse;

    } catch (error) {
        if (error instanceof Error) {
            console.error('Error during job processing:', error.message);
        } else {
            console.error('Unexpected error:', error);
        }
        throw error;
    }
}