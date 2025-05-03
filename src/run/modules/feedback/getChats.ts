// src/getChats.ts
import { Page } from 'puppeteer';
import { SELECTORS_CHAT, TIMEOUTS } from '../../../config/index.js';
import { FeedbackWithResponse } from '../../../interface/index.js';
import { extractChatId } from '../../../utils/feedbackUtils.js';

export async function getChats(page: Page): Promise<FeedbackWithResponse[]> {
    try {
        await page.screenshot({ path: 'screenshot-VACANCY_CARD.png' });

        await page.waitForSelector(SELECTORS_CHAT.CHAT_CARD, { timeout: TIMEOUTS.LONG });
        const chats = await page.$$(SELECTORS_CHAT.CHAT_CARD);

        const chatsWithResponse: FeedbackWithResponse[] = [];
        const visitedIds = new Set<number>();

        for (const chatHandle of chats) {
            const chatUrl = await page.evaluate(
                (el) => (el as HTMLAnchorElement).href,
                chatHandle
            );


            const { chatId } = await extractChatId({ chatUrl });
            if (!visitedIds.has(chatId)) {
                visitedIds.add(chatId);
                chatsWithResponse.push({ chatId, chatLinkHandle: chatHandle });
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