import client from "./config/dbConfig.js";
import { broadcast } from './server/startWebSocketServer.js';

client.connect()
    .then(() => console.log('Connected to PostgreSQL'))
    .catch(err => console.error('Connection error:', err.stack));

export async function saveVacancy(vacancy) {
    const query = `
        INSERT INTO vacancies (id, title_vacancy, url_vacancy, title_company, url_company, vacancy_status, response_date, profileId, userId)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO UPDATE 
        SET title_vacancy = $2, url_vacancy = $3, title_company = $4, url_company = $5, vacancy_status = $6, response_date = $7, profileId = $8, userId = $9;
    `;
    const values = [
        vacancy.id,
        vacancy.vacancyTitleText,
        vacancy.vacancyLinkText,
        vacancy.companyTitleText,
        vacancy.companyLinkText,
        vacancy.vacancyStatus,
        vacancy.responseDate,
        vacancy.profileId,
        vacancy.userId
    ];

    try {
        await client.query(query, values);
        broadcast(`Vacancy with ID ${vacancy.id} has been successfully saved`);
    } catch (err) {
        console.error('Error when saving a vacancy:', err);
    }
}

export async function getList() {
    try {
        const result = await client.query('SELECT * FROM vacancies');
        return result.rows;
    } catch (err) {
        console.error('Data retrieval error:', err);
        throw err;
    }
}

export async function getProfileById(id) {
    const query = 'SELECT * FROM profiles WHERE id = $1';
    try {
        const result = await client.query(query, [id]);
        return result.rows[0] || null;
    } catch (err) {
        console.error('Error when retrieving profile:', err);
        throw err;
    }
}

export async function getVacanciesByUserId(userId) {
    const query = 'SELECT * FROM vacancies WHERE userId = $1';
    try {
        const result = await client.query(query, [userId]);
        return result.rows;
    } catch (err) {
        console.error('Error when retrieving vacancies by userId:', err);
        throw err;
    }
}

export async function getVacanciesByProfileId(profileId) {
    const query = 'SELECT * FROM vacancies WHERE profileId = $1';
    try {
        const result = await client.query(query, [profileId]);
        return result.rows;
    } catch (err) {
        console.error('Error when retrieving vacancies by profileId:', err);
        throw err;
    }
}