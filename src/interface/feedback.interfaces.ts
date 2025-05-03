import { ElementHandle } from 'puppeteer';

export interface GetFeedbackParams {
    userId: string;
    email: string;
    password: string;
}

export interface ExtractFeedbackData {
    chatId: number;
    url_vacancy: string;
    response_status: string;
    feedback_text: string;
    feedback_date: string;
    feedback_time: string;
}

export interface SendFeedbackParams {
    userId: string;
    email: string;
    password: string;
    position: string;
    message: string;
    vacancyUrl: string;
}

export interface FeedbackData {
    id: number;
    vacancy_id: number;
    feedback_text: string;
    feedback_date: Date;
    response_status: string;
}

export interface FeedbackWithResponse {
    chatId: number;
    chatLinkHandle: ElementHandle | null;
} 