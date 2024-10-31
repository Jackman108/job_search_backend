import express from 'express';
import { Browser, ElementHandle, Page } from 'puppeteer';
import { WebSocketServer } from 'ws';

export interface InitializeMiddleware {
    (app: express.Application): void;
}

export interface CorsOptions {
    origin: string;
    credentials: boolean;
}
export interface SendFeedbackParams {
    userId: string;
    email: string;
    password: string;
    position: string;
    message: string;
    vacancyUrl: string;
}
export interface GetFeedbackParams {
    userId: string;
    email: string;
    password: string;
}

export interface UserProfileUpdateFields {
    firstName?: string;
    lastName?: string;
    avatar?: string;
}

export interface StartHttpServerParams {
    port: number;
}
export interface AvatarUploadParams {
    avatar: string;
    updateFields: UserProfileUpdateFields;
}

export interface StartWebSocketServerParams {
    app: express.Application;
    wsPort: number;
}

export interface WebSocketServerWrapper {
    server: WebSocketServer;
    clients: Set<WebSocket>;
}

export interface Counters {
    successfullySubmittedCount: number;
    unsuccessfullySubmittedCount: number;
}

export interface PuppeteerContext {
    browser: Browser | null;
    page: Page | null;
    counters: Counters;
}

export interface VacancyData {
    id: number;
    title_vacancy: string;
    url_vacancy: string;
    title_company: string;
    url_company: string;
    vacancy_status: string;
    response_date: string;
    response_date_time?: string;
    response_date_date?: string;
}

export interface ProcessVacancyParams {
    page: Page;
    vacancyResponse: ElementHandle<Element>;
    data: VacancyData;
    counters: Counters;
    message: string;
    userId: string;
}
export interface ProcessChatParams {
    page: Page;
    chatLinkHandle: ElementHandle<Element>;
    data: ChatData;
    userId: string;
}
export interface FeedbackChatParams {
    page: Page;
    chatLinkHandle: ElementHandle<Element>;
    chatId: number;
    chatUrl?: string;
    userId: string;
}

export interface Vacancy {
    data: VacancyData;
    vacancyResponse: ElementHandle<Element>;
}
export interface VacancyWithResponse {
    data: VacancyData;
    vacancyResponse: ElementHandle<Element> | null;
}
export interface ChatWithResponse {
    chatId: number;
    chatLinkHandle: ElementHandle<Element> | null;
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

export interface ExtractVacancyDataParams {
    title_vacancy: string;
    url_vacancy: string;
    title_company: string;
    url_company: string;
}
export interface ExtractChatDataParams {
    chatUrl: string;
}
export interface ExtractChatIdParams {
    chatId: number;
}
export interface ExtractFeedbackData {
    chatId: number,
    userId: string;
    url_vacancy: string;
    response_status: string;
    feedback_text: string;
    feedback_date: string;
    feedback_time: string;
}

export interface ProfileData {
    userId: string | number;
    firstName?: string;
    lastName?: string;
    avatar?: string;
    balance?: number;
    spinCount?: number;
    successfulResponsesCount?: number;
    currentStatus?: string;
    updatedAt?: string | Date;
}

export interface ChatData {
    id: number;
    vacancy_id: number;
    feedback_text: string;
    feedback_date: Date;
    response_status: string;
}