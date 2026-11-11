import type { FeedbackRepo, JobBroadcast, VacancyRepo } from '@market-hunter/hh-worker/job';
import { Browser, ElementHandle, Page } from 'puppeteer';
import { Counters } from './common.interfaces';
import { VacancyData } from './vacancy.interfaces';

export interface ProcessVacancyParams {
    page: Page;
    vacancyResponse: ElementHandle;
    data: VacancyData;
    counters: Counters;
    message: string;
    userId: string;
    vacancyRepo: VacancyRepo;
    broadcast: JobBroadcast;
}

export interface ProcessChatParams {
    page: Page;
    chatLinkHandle: ElementHandle;
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
}

export interface navigateAndProcessChats {
    userId: string;
    page: Page;
    browser: Browser;
    feedbackRepo: FeedbackRepo;
}

export interface ExtractChatDataParams {
    chatUrl: string;
}
