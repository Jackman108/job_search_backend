import client from "./config/dbConfig.js";
import { broadcast } from './server/startWebSocketServer.js';

client.connect()
    .then(() => console.log('Connected to PostgreSQL'))
    .catch(err => console.error('Connection error:', err.stack));

export async function saveVacancy(vacancy) {
    const tableName = `${vacancy.userId}_vacancies`;

    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS ${tableName} (
            id BIGINT PRIMARY KEY,
            title_vacancy VARCHAR(255),
            url_vacancy TEXT,
            title_company VARCHAR(255),
            url_company TEXT,
            vacancy_status VARCHAR(50),
            response_date TIMESTAMP,
            user_id INT
        );
    `;

    const insertOrUpdateQuery = `
    INSERT INTO ${tableName} (id, title_vacancy, url_vacancy, title_company, url_company, vacancy_status, response_date, user_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (id) DO UPDATE 
    SET title_vacancy = $2, url_vacancy = $3, title_company = $4, url_company = $5, vacancy_status = $6, response_date = $7, user_id = $8;
`;

    const values = [
        vacancy.id,
        vacancy.vacancyTitleText,
        vacancy.vacancyLinkText,
        vacancy.companyTitleText,
        vacancy.companyLinkText,
        vacancy.vacancyStatus,
        vacancy.responseDate,
        vacancy.userId
    ];

    try {
        await client.query(createTableQuery);
        await client.query(insertOrUpdateQuery, values);
        broadcast(`Vacancy with ID ${vacancy.id} has been successfully saved`);
    } catch (err) {
        console.error('Error when saving a vacancy:', err);
    }
}

export async function getVacancies(userId) {
    const tableName = `${userId}_vacancies`;
    const query = `SELECT * FROM ${tableName}`;
    try {
        const result = await client.query(query);
        return result.rows;
    } catch (err) {
        console.error(`Error retrieving vacancies for user ${userId}:`, err);
        throw err;
    }
}

export async function getUserProfile(userId) {
    const query = `
        SELECT p.*
        FROM profiles p
        JOIN users u ON u.profile_id = p.id
        WHERE u.id = $1
    `;

    try {
        const result = await pool.query(query, [userId]);
        return result.rows[0] || null;
    } catch (err) {
        console.error('Error when retrieving profile:', err);
        throw err;
    }
}