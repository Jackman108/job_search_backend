// Импортируем необходимые модули
import express, {Request} from 'express';
import {Browser, ElementHandle, Page} from 'puppeteer';

// ------------------------
// Интерфейсы для сервера
// ------------------------

export interface InitializeMiddleware {
    (app: express.Application): void;
}

export interface StartHttpServerParams {
    port: number;
}

export interface StartWebSocketServerParams {
    app: express.Application;
    wsPort: number;
}

export interface AuthenticatedRequest extends Request {
    userId?: string;
}

// ------------------------
// Интерфейсы для пользователей
// ------------------------

export interface UserProfileUpdateFields {
    firstName?: string;
    lastName?: string;
    avatar?: string;
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

// ------------------------
// Интерфейсы для обратной связи
// ------------------------

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

export interface ExtractFeedbackData {
    chatId: number;
    userId: string;
    url_vacancy: string;
    response_status: string;
    feedback_text: string;
    feedback_date: string;
    feedback_time: string;
}

// ------------------------
// Интерфейсы для вакансий
// ------------------------

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

export interface Vacancy {
    data: VacancyData;
    vacancyResponse: ElementHandle;
}

export interface VacancyWithResponse {
    data: VacancyData;
    vacancyResponse: ElementHandle | null;
}

// ------------------------
// Интерфейсы для чатов
// ------------------------

export interface ChatData {
    id: number;
    vacancy_id: number;
    feedback_text: string;
    feedback_date: Date;
    response_status: string;
}

export interface ChatWithResponse {
    chatId: number;
    chatLinkHandle: ElementHandle | null;
}

// ------------------------
// Интерфейсы для параметров обработки
// ------------------------

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

// ------------------------
// Общие интерфейсы
// ------------------------

export interface Counters {
    successfullySubmittedCount: number;
    unsuccessfullySubmittedCount: number;
}

export interface PuppeteerContext {
    browser: Browser | null;
    page: Page | null;
    counters: Counters;
}

// ------------------------
// Интерфейсы для извлечения данных
// ------------------------

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

export interface AvatarUploadParams {
    avatar: string;
    updateFields: UserProfileUpdateFields;
}

// ------------------------
// Интерфейсы для подписок
// ------------------------
export interface Subscription {
    id: string;
    userId: string;
    subscriptionType: string;
    price: number;
    startDate: string;
    endDate?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Payment {
    id: number;
    userId: string;
    amount: number;
    paymentStatus: string;
    paymentMethod?: string;
    createdAt: string;
    updatedAt: string;
}
