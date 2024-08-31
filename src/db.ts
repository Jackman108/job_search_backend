import client from "./config/dbConfig.js";
import { ProfileData, VacancyData } from "./interface/interface.js";
import { broadcast } from './server/startWebSocketServer.js';

client.connect()
    .then(() => console.log('Connected to PostgreSQL'))
    .catch(err => console.error('Connection error:', err.stack));

export const createVacancyTable = async (profileData: ProfileData): Promise<void> => {
    const userId = profileData.userId.toString();
    const tableName = `"${userId}_vacancy"`;

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
    if (!userId) {
        throw new Error('User ID is required');
    }
    const tableName = `"${userId}_vacancy"`;
    try {
        const query = `SELECT * FROM ${tableName}`;
        const result = await client.query(query);
        if (result.rows.length === 0) {
            result.rows = [];
        }
        return result.rows;
    } catch (err) {
        console.error(`Error retrieving vacancies for user ${userId}:`, err);
        throw err;
    }
}

export async function deleteVacancy(vacancyId: string | number, userId: string | number): Promise<void> {
    const tableName = `"${userId}_vacancy"`;
    const deleteQuery = `
    DELETE FROM ${tableName}
    WHERE id = $1;
    `;
    try {
        await client.query(deleteQuery, [vacancyId]);
        broadcast(`Vacancy has been successfully saved with ID ${vacancyId} deleted.`);
    } catch (err) {
        console.error('Error when deleting a vacancy:', err);
    }
}


export async function getUserProfile(userId: string | number): Promise<ProfileData> {
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


export async function createUserProfile(profileData: ProfileData): Promise<void> {
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
        profileData.currentStatus || 'inactive',
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

export async function updateUserProfile(userId: string | number, profileData: Partial<ProfileData>): Promise<ProfileData> {
    const updateFields = [];
    const values = [];
    let index = 1;

    if (profileData.firstName) {
        updateFields.push(`first_name = $${index++}`);
        values.push(profileData.firstName);
    }
    if (profileData.lastName) {
        updateFields.push(`last_name = $${index++}`);
        values.push(profileData.lastName);
    }
    if (profileData.avatar) {
        updateFields.push(`avatar = $${index++}`);
        values.push(profileData.avatar);
    }

    updateFields.push(`updated_at = $${index++}`);
    values.push(new Date().toISOString());
    values.push(userId);

    const updateProfileQuery = `
    UPDATE profiles
    SET ${updateFields.join(', ')}
    WHERE user_id = $${index}
    RETURNING id, first_name AS "firstName", last_name AS "lastName", avatar, updated_at AS "updatedAt";
  `;

    try {
        const result = await client.query(updateProfileQuery, values);

        if (result.rows.length === 0) {
            throw new Error(`Profile not found for userId: ${userId}`);
        }

        broadcast(`Profile with ID ${userId} has been successfully updated.`);
        return result.rows[0];
    } catch (err) {
        console.error('Error when updating profile:', err);
        throw err;
    }
}

export async function incrementSpinCount(userId: string | number): Promise<void> {
    const updateProfileQuery = `
        UPDATE profiles
        SET spin_count = spin_count + 1, updated_at = NOW()
        WHERE user_id = $1;
    `;

    try {
        await client.query(updateProfileQuery, [userId]);
    } catch (err) {
        console.error('Error when updating spin_count:', err);
        throw err;
    }
}

export async function updateSuccessfulResponsesCount(userId: string | number): Promise<void> {
    const tableName = `"${userId}_vacancy"`;
    const countSuccessfulResponsesQuery = `
    SELECT COUNT(*) AS "successfulResponsesCount"
    FROM ${tableName}
    WHERE vacancy_status = 'true';
    `;

    const updateProfileQuery = `
    UPDATE profiles
    SET successful_responses_count = $1
    WHERE user_id = $2;
    `;
    try {
        const result = await client.query(countSuccessfulResponsesQuery);
        const rawCount = result.rows[0].successfulResponsesCount;
        const successfulResponsesCount = parseInt(rawCount, 10);
        await client.query(updateProfileQuery, [successfulResponsesCount, userId]);
    } catch (err) {
        console.error('Error when updating successful_responses_count:', err);
        throw err;
    }
}

export async function deleteUser(userId: string | number, accessToken: string): Promise<void> {
    if (!userId) {
        throw new Error('User ID is required');
    }

    try {
        await deleteUserFromUsers(userId, accessToken);
        await deleteUserProfile(userId);
        await deleteVacancyTable(userId);

        broadcast(`User with ID ${userId} has been successfully deleted.`);
    } catch (err) {
        console.error('Error when deleting user:', err);
        throw err;
    }
}

async function deleteUserFromUsers(userId: string | number, accessToken: string): Promise<void> {
    const query = `DELETE FROM users WHERE id = $1`;

    try {
        await client.query(query, [userId]);
    } catch (err) {
        console.error(`Error when deleting user from users table:`, err);
        throw err;
    }
}

async function deleteUserProfile(userId: string | number): Promise<void> {
    const query = `DELETE FROM profiles WHERE user_id = $1`;

    try {
        await client.query(query, [userId]);
    } catch (err) {
        console.error(`Error when deleting user profile from profiles table:`, err);
        throw err;
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