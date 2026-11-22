import type { VacancyData } from '@market-hunter/hh-worker/types';
import { broadcast } from '@server';
import { executeQuery } from '../../../utils/index.js';
import { vacancyTableIdent } from '../module.config.js';

export async function ensureVacanciesTable(): Promise<void> {
    const tableName = vacancyTableIdent();
    await executeQuery(`
        CREATE TABLE IF NOT EXISTS ${tableName} (
            user_id UUID NOT NULL,
            id BIGINT NOT NULL,
            title_vacancy VARCHAR(255),
            url_vacancy TEXT,
            title_company VARCHAR(255),
            url_company TEXT,
            vacancy_status VARCHAR(50),
            response_date TIMESTAMP,
            PRIMARY KEY (user_id, id)
        );
    `);
}

/** @deprecated Use ensureVacanciesTable — kept for call-site compatibility. */
export async function createTableVacanciesUser(_userId: string): Promise<void> {
    await ensureVacanciesTable();
}

/** Clear all vacancy rows for the user (does not drop the shared table). */
export async function deleteVacancyTable(userId: string): Promise<void> {
    const tableName = vacancyTableIdent();
    await ensureVacanciesTable();
    await executeQuery(`DELETE FROM ${tableName} WHERE user_id = $1`, [userId]);
    broadcast(`Vacancies cleared for user ${userId}`);
}

export async function saveVacancy(data: VacancyData, userId: string): Promise<void> {
    const tableName = vacancyTableIdent();
    await ensureVacanciesTable();

    const insertOrUpdateQuery = `
        INSERT INTO ${tableName} (
            user_id, id, title_vacancy, url_vacancy, title_company, url_company, vacancy_status, response_date
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (user_id, id) DO UPDATE
        SET title_vacancy = $3, url_vacancy = $4, title_company = $5, url_company = $6,
            vacancy_status = $7, response_date = $8;
    `;

    await executeQuery(insertOrUpdateQuery, [
        userId,
        data.id,
        data.title_vacancy,
        data.url_vacancy,
        data.title_company,
        data.url_company,
        data.vacancy_status,
        data.response_date,
    ]);
    broadcast(`Vacancy has been successfully saved with ID ${data.id}`);
}

export async function getVacanciesUser(userId: string): Promise<any[]> {
    const tableName = vacancyTableIdent();
    await ensureVacanciesTable();
    const result = await executeQuery(`SELECT * FROM ${tableName} WHERE user_id = $1`, [userId]);
    return result.length > 0 ? result : [];
}

export async function deleteVacancyUser(userId: string, vacancyId: string | number): Promise<void> {
    const tableName = vacancyTableIdent();
    await executeQuery(`DELETE FROM ${tableName} WHERE user_id = $1 AND id = $2`, [userId, vacancyId]);
    broadcast(`Vacancy with ID ${vacancyId} has been successfully deleted.`);
}

export async function countSuccessfulVacancies(userId: string): Promise<number> {
    const tableName = vacancyTableIdent();
    await ensureVacanciesTable();
    const result = await executeQuery<{ n: number | string }>(
        `SELECT COUNT(*)::int AS n FROM ${tableName} WHERE user_id = $1 AND vacancy_status = 'true'`,
        [userId],
    );
    return parseInt(String(result[0]?.n ?? 0), 10);
}
