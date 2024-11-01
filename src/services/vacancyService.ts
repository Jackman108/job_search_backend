// vacancyService.ts
import client from '../config/dbConfig.js';
import { VacancyData } from '../interface/interface.js';
import { broadcast } from '../server/startWebSocketServer.js';

export const createTableVacanciesUser = async (userId: string | number): Promise<void> => {
    const id = userId.toString();
    const tableName = `"${id}_vacancy"`;
    console.log(tableName)

    const createTableQuery = `
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

    try {
        await client.query(createTableQuery);
        console.log(`Table ${tableName} created or already exists.`);
    } catch (err) {
        console.error(`Error creating table ${tableName}:`, err);
        throw err;
    }
};

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

    try {
        await client.query(insertOrUpdateQuery, values);
        broadcast(`Vacancy has been successfully saved with ID ${data.id}`);
    } catch (err) {
        console.error('Error when saving a vacancy:', err);
    }
}

export async function getVacanciesUser(userId: string | number): Promise<any[]> {
    try {
        const query = `SELECT * FROM ${`"${userId}_vacancy"`}`;
        const result = await client.query(query);
        return result.rows.length > 0 ? result.rows : [];
    } catch (err) {
        console.error(`Error retrieving vacancies for user ${userId}:`, err);
        throw err;
    }
}

export async function deleteVacancyUser(vacancyId: string | number, userId: string | number): Promise<void> {
    const deleteQuery = `
        DELETE FROM ${`"${userId}_vacancy"`}
        WHERE id = $1;
    `;
    try {
        await client.query(deleteQuery, [vacancyId]);
        broadcast(`Vacancy with ID ${vacancyId} has been successfully deleted.`);
    } catch (err) {
        console.error('Error when deleting a vacancy:', err);
    }
}

async function deleteVacancyTable(userId: string | number): Promise<void> {
    const tableName = `"${userId}_vacancy"`;
    const query = `DROP TABLE IF EXISTS ${tableName}`;

    try {
        await client.query(query);
    } catch (err) {
        console.error(`Error when dropping vacancy table ${tableName}:`, err);
        throw err;
    }
}