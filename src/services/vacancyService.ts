// vacancyService.ts
import {VacancyData} from '../interface/interface.js';
import {broadcast} from '../server/startWebSocketServer.js';
import {deleteTable, executeQuery, tableExists} from "../utils/queryHelpers.js";

export async function createTableVacanciesUser(userId: string | number): Promise<void> {
    const tableName = `"${userId}_vacancy"`;

    const query = `
        CREATE TABLE IF NOT EXISTS ${tableName} (
            id BIGINT PRIMARY KEY,
            title_vacancy VARCHAR(255),
            url_vacancy TEXT,
            title_company VARCHAR(255),
            url_company TEXT,
            vacancy_status VARCHAR(50),
            response_date TIMESTAMP                
        );
    `;

        await executeQuery(query);
}


export async function deleteVacancyTable(userId: string | number): Promise<void> {
    await deleteTable(userId, 'vacancy');
}


export async function saveVacancy(data: VacancyData, userId: string | number): Promise<void> {
    const tableName = `"${userId}_vacancy"`;

    const insertOrUpdateQuery = `
        INSERT INTO ${tableName} (id, title_vacancy, url_vacancy, title_company, url_company, vacancy_status, response_date)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO UPDATE 
        SET title_vacancy = $2, url_vacancy = $3, title_company = $4, url_company = $5, vacancy_status = $6, response_date = $7;
    `;

    const values = [
        data.id,
        data.title_vacancy,
        data.url_vacancy,
        data.title_company,
        data.url_company,
        data.vacancy_status,
        data.response_date,
    ];

    await executeQuery(insertOrUpdateQuery, values);
    broadcast(`Vacancy has been successfully saved with ID ${data.id}`);
}


export async function getVacanciesUser(userId: string | number): Promise<any[]> {
    const tableName = `"${userId}_vacancy"`;
    const exists = await tableExists(tableName);
    if (!exists) {
        await createTableVacanciesUser(userId);
    }
        const query = `SELECT * FROM ${tableName}`;
        const result = await executeQuery(query);
        return result.length > 0 ? result : [];


}


export async function deleteVacancyUser(userId: string | number, vacancyId: string | number): Promise<void> {
    const tableName = `"${userId}_vacancy"`;
    const query = `DELETE FROM ${tableName} WHERE id = $1;`;
    await executeQuery(query, [vacancyId]);
    broadcast(`Vacancy with ID ${vacancyId} has been successfully deleted.`);
}

