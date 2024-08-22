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
            user_id INT,
            FOREIGN KEY (profile_id) REFERENCES profiles(id)
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


export async function getVacanciesUser(userId) {
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
        SELECT
            id,
            first_name AS "firstName",
            last_name AS "lastName",
            avatar,
            balance,
            spin_count AS "spinCount",
            successful_responses_count AS "successfulResponsesCount",
            current_status AS "currentStatus",
            user_id AS "userId",
            updated_at AS "updatedAt"
        FROM
            profiles
        WHERE
            user_id = $1;
    `;

    try {
        const result = await client.query(query, [userId]);
        if (result.rows.length === 0) {
            throw new Error(`Profile not found for userId: ${userId}`);
        }
        return result.rows[0];
    } catch (err) {
        console.error('Error when retrieving user profile:', err);
        throw err;
    }
}



export async function createUserProfile(profileData) {
    const createProfileQuery = `
        INSERT INTO profiles (
            first_name, last_name, avatar, balance, spin_count, successful_responses_count, current_status, user_id, updated_at
            )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id;
    `;

    const values = [
        profileData.firstName || 'Иван',
        profileData.lastName || 'Иванов',
        profileData.avatar || '',
        profileData.balance || 0,
        profileData.spinCount || 0,
        profileData.successfulResponsesCount || 0,
        profileData.currentStatus || 'active',
        profileData.userId,
        profileData.updatedAt || new Date().toISOString()
    ];

    try {
        await client.query(createProfileQuery, values);
        broadcast(`Profile has been successfully created to user ${profileData.userId}`);
    } catch (err) {
        console.error('Error when creating user profile:', err);
    }
}


export async function updateUserProfile(profileData) {
    const updateProfileQuery = `
        UPDATE profiles
        SET email = $1,
            updated_at = $2,
            avatar = $3,
            first_name = $4,
            last_name = $5,
            balance = $6,
            spin_count = $7,
            successful_responses_count = $8,
            current_status = $9
        WHERE id = $10
        RETURNING user_id;
    `;

    const updateUserQuery = `
        UPDATE users
        SET profile_id = $1
        WHERE id = $2;
    `;

    const values = [
        profileData.email,
        profileData.updatedAt || new Date().toISOString(),
        profileData.avatar,
        profileData.firstName,
        profileData.lastName,
        profileData.balance,
        profileData.spinCount,
        profileData.successfulResponsesCount,
        profileData.currentStatus,
    ];

    try {
        const result = await client.query(updateProfileQuery, values);
        const userId = result.rows[0].user_id;

        if (userId) {
            await client.query(updateUserQuery, [profileData.id, userId]);
        }

        broadcast(`Profile with ID ${profileData.id} has been successfully updated for user ${userId}`);
    } catch (err) {
        console.error('Error when updating profile:', err);
        throw err;
    }
}


