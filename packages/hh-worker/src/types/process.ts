import type { Browser, ElementHandle, Page } from 'puppeteer';
import type { JobBroadcast } from '../job/broadcast.types.js';
import type { FeedbackRepo } from '../job/feedbackRepo.types.js';
import type { VacancyRepo } from '../job/vacancyRepo.types.js';
import type { Counters } from './counters.js';
import type { VacancyData } from './vacancy.js';

export interface ProcessVacancyParams {
    page: Page;
    data: VacancyData;
    counters: Counters;
    message: string;
    userId: string;
    vacancyRepo: VacancyRepo;
    broadcast: JobBroadcast;
    jobId: string;
    serpUrl?: string;
}

export interface ProcessChatParams {
    page: Page;
    chatLinkHandle: ElementHandle | null;
    chatId: number;
    chatUrl?: string;
    userId: string;
    feedbackRepo: FeedbackRepo;
}

export interface NavigateAndProcessVacanciesParams {
    userId: string;
    page: Page;
    counters: Counters;
    message: string;
    browser: Browser;
    vacancyRepo: VacancyRepo;
    broadcast: JobBroadcast;
    jobId: string;
    serpUrl?: string;
    dryRun?: boolean;
    applyCap?: number;
}

export interface NavigateAndProcessChatsParams {
    userId: string;
    page: Page;
    browser: Browser;
    feedbackRepo: FeedbackRepo;
}

export interface ExtractChatDataParams {
    chatUrl: string;
}

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
