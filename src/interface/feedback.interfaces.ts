import { ElementHandle } from 'puppeteer';

/** @deprecated Prefer `@market-hunter/contracts`. */
export type { GetFeedbackParams, SendFeedbackParams } from '@market-hunter/contracts';

export interface ExtractFeedbackData {
    chatId: number;
    url_vacancy: string;
    response_status: string;
    feedback_text: string;
    feedback_date: string;
    feedback_time: string;
    title_vacancy?: string;
    title_company?: string;
}

export interface FeedbackData {
    id: number;
    vacancy_id: number;
    feedback_text: string;
    feedback_date: Date;
    response_status: string;
    title_vacancy?: string;
    title_company?: string;
}

export interface FeedbackWithResponse {
    chatId: number;
    chatLinkHandle: ElementHandle | null;
}
