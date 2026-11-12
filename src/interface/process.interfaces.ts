import type { FeedbackRepo, JobBroadcast, VacancyRepo } from '@market-hunter/hh-worker/job';
import { Browser, ElementHandle, Page } from 'puppeteer';
import { Counters } from './common.interfaces';
import { VacancyData } from './vacancy.interfaces';

export interface ProcessVacancyParams {
    page: Page;
    data: VacancyData;
    counters: Counters;
    message: string;
    userId: string;
    vacancyRepo: VacancyRepo;
    broadcast: JobBroadcast;
    /** Job file id — CAPTCHA mid-apply uses the same POST /jobs/:id/captcha channel. */
    jobId: string;
    /** Live SERP URL after search — used when goBack leaves apply/account surfaces. */
    serpUrl?: string;
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
    jobId: string;
    serpUrl?: string;
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
