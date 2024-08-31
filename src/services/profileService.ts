import client from '../config/dbConfig.js';
import { ProfileData } from '../interface/interface';
import { broadcast } from '../server/startWebSocketServer.js';

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
        broadcast(`Profile has been successfully created for user ${profileData.userId}`);
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
        console.error('Error when updating successful responses count:', err);
        throw err;
    }
}
