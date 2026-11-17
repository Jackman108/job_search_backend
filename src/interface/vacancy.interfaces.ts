/** @deprecated Prefer `@market-hunter/hh-worker/types`. */
export type { ExtractVacancyDataParams, VacancyData, VacancyWithResponse } from '@market-hunter/hh-worker/types';

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
    /** Linked HH credentials row (`vacancy_auth.id`); optional for legacy rows. */
    vacancy_auth_id?: number | null;
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
    vacancy_auth_id?: number | null;
}
