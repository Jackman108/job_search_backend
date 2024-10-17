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
export interface PuppeteerScriptParams {
    userId: string;
    email: string;
    password: string;
    position: string;
    message: string;
    vacancyUrl: string;
}

export interface UserProfileUpdateFields {
    firstName: string;
    lastName: string;
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

export interface Vacancy {
    data: VacancyData;
    vacancyResponse: ElementHandle<Element>;
}
export interface VacancyWithResponse {
    data: VacancyData;
    vacancyResponse: ElementHandle<Element> | null;
}

export interface NavigateAndProcessVacanciesParams {
    userId: string;
    page: Page;
    counters: Counters;
    message: string;
    isStopped: () => boolean;
}

export interface ExtractVacancyDataParams {
    title_vacancy: string;
    url_vacancy: string;
    title_company: string;
    url_company: string;
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
