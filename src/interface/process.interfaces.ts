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
}

export interface ProcessChatParams {
    page: Page;
    chatLinkHandle: ElementHandle;
    chatId: number;
    chatUrl?: string;
    userId: string;
}

export interface NavigateAndProcessVacanciesParams {
    userId: string;
    page: Page;
    counters: Counters;
    message: string;
    browser: Browser;
}

export interface navigateAndProcessChats {
    userId: string;
    page: Page;
    browser: Browser;
}

export interface ExtractChatDataParams {
    chatUrl: string;
} 