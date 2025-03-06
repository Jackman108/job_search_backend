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
    user_id: string;
    first_name: string;
    last_name: string;
    avatar?: string;
}

export interface ProfileData {
    id: number;
    user_id: string | number;
    first_name: string;
    last_name: string;
    avatar: string;
    balance: number;
    spin_count: number;
    successful_responses_count: number;
    current_status: string;
}

// ------------------------
// Интерфейсы для обратной связи
// ------------------------

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

/*
export interface Vacancy {
    data: VacancyData;
    vacancyResponse: ElementHandle;
}
*/
export interface VacancyWithResponse {
    data: VacancyData;
    vacancyResponse: ElementHandle | null;
}

export interface SendFeedbackParams {
    userId: string;
    email: string;
    password: string;
    position: string;
    message: string;
    vacancyUrl: string;
}

// ------------------------
// Интерфейсы для чатов
// ------------------------


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

/*
export interface PuppeteerContext {
    browser: Browser | null;
    page: Page | null;
    counters: Counters;
}
*/
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

export interface AvatarUploadParams {
    avatar: string;
    updateFields: UserProfileUpdateFields;
}

// ------------------------
// Интерфейсы для подписок
// ------------------------
export type SubscriptionType = 'daily' | 'weekly' | 'monthly';

export interface SubscriptionRequestBody {
    subscription_type: SubscriptionType;
    start_date: Date;
}

export interface Subscription {
    id: string;
    user_id: string;
    subscription_type: SubscriptionType;
    price: number;
    start_date: Date;
    end_date: Date;
    created_at: Date;
    updated_at: Date;
}

export interface Payment {
    id: string;
    subscription_id: string;
    amount: number;
    payment_status: 'pending' | 'completed' | 'failed';
    payment_method: string;
    created_at: Date;
    updated_at: Date;
}

// Интерфейс для данных vacancy_auth
export interface VacancyAuthData {
    id?: number;
    email: string;
    password: string;
    user_id: string;
    created_at?: Date;
    updated_at?: Date;
}

// Интерфейс для данных vacancy_submit
export interface VacancySubmitData {
    id?: number;
    user_id: string;
    position: string;
    message: string;
    vacancy_url: string;
    schedule: string;
    order_by: string;
    search_field: string;
    experience: string;
    search_period: string;
    createdAt?: Date;
    updatedAt?: Date;
}

// Интерфейс для обновления vacancy_auth
export interface UpdateVacancyAuthData {
    id: number;
    user_id: string;
    email?: string;
    password?: string;
}

// Интерфейс для обновления vacancy_submit
export interface UpdateVacancySubmitData {
    id: number;
    user_id: string;
    position?: string;
    message?: string;
    vacancy_url?: string;
    schedule?: string;
    order_by?: string;
    search_field?: string;
    experience?: string;
    search_period?: string;
}