import {ProfileData} from '../interface/interface.js';
import {broadcast} from '../server/startWebSocketServer.js';
import {executeQuery} from "../utils/queryHelpers.js";


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
    const result = await executeQuery(query, [userId]);
    if (result.length === 0) {
        await createUserProfile(userId.toString());
        return await getUserProfile(userId);  // Повторно вызываем функцию для получения данных
    }

    return result[0];
}


export async function createUserProfile(userId: string): Promise<void> {
    const id = userId.toString();
    const query = `
        INSERT INTO profiles (
            first_name, last_name, avatar, balance, spin_count, successful_responses_count, current_status, user_id, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id;
    `;
    const values = [
        'Имя',
        'Фамилия',
        '',
        0,
        0,
        0,
        'inactive',
        id,
        new Date().toISOString()
    ];
    await executeQuery(query, values);

    broadcast(`Profile has been successfully created for user ${userId}`);
}


export async function updateUserProfile(profileData: Partial<ProfileData>): Promise<ProfileData> {
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
    values.push(profileData.userId);

    const query = `
        UPDATE profiles
        SET ${updateFields.join(', ')}
        WHERE user_id = $${index}
        RETURNING id, first_name AS "firstName", last_name AS "lastName", avatar, updated_at AS "updatedAt";
    `;
    const result = await executeQuery(query, values);
    if (result.length === 0) throw new Error(`Profile not found for userId: ${profileData.userId}`);
    broadcast(`Profile with ID ${profileData.userId} has been successfully updated.`);
    return result[0];

}


export async function deleteUserProfile(userId: string | number): Promise<void> {
    const query = `DELETE FROM profiles WHERE user_id = $1`;
    await executeQuery(query, [userId]);
}


export async function incrementSpinCount(userId: string | number): Promise<void> {
    const query = `
        UPDATE profiles
        SET spin_count = spin_count + 1, updated_at = NOW()
        WHERE user_id = $1;
    `;

    await executeQuery(query, [userId]);
}


export async function updateSuccessfulResponsesCount(userId: string | number): Promise<void> {
    const tableName = `"${userId}_vacancy"`;
    const countQuery = `
        SELECT COUNT(*) AS "successfulResponsesCount"
        FROM ${tableName}
        WHERE vacancy_status = 'true';
    `;

    const updateQuery = `
        UPDATE profiles
        SET successful_responses_count = $1
        WHERE user_id = $2;
    `;

    const result = await executeQuery(countQuery);
    const rawCount = result[0]?.successfulResponsesCount || 0;
    const successfulResponsesCount = parseInt(rawCount, 10);
    await executeQuery(updateQuery, [successfulResponsesCount, userId]);
}
