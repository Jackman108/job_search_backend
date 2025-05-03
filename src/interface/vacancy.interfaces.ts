import { ElementHandle } from 'puppeteer';

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

export interface VacancyWithResponse {
    data: VacancyData;
    vacancyResponse: ElementHandle | null;
}

export interface ExtractVacancyDataParams {
    title_vacancy: string;
    url_vacancy: string;
    title_company: string;
    url_company: string;
}

export interface VacancyAuthData {
    id?: number;
    email: string;
    password: string;
    user_id: string;
    created_at?: Date;
    updated_at?: Date;
}

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

export interface UpdateVacancyAuthData {
    id: number;
    user_id: string;
    email?: string;
    password?: string;
}

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