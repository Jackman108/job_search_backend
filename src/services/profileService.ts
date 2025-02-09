import {ProfileData} from '../interface/interface.js';
import {broadcast} from '../server/startWebSocketServer.js';
import {executeQuery} from "../utils/queryHelpers.js";
import {invalidateUserProfileCache, userProfileCache} from "../utils/cacheQueryHelpers.js";

async function createUserProfile(userId: string | number): Promise<void> {
    const query = `
        INSERT INTO profiles (
            first_name, last_name, avatar, balance, spin_count, successful_responses_count, current_status, user_id, updated_at
        )
        VALUES ($1, $2, $3, 0, 0, 0, 'inactive', $4, NOW())
        RETURNING id;
    `;
    const values = ['Имя', 'Фамилия', '', userId];

    await executeQuery(query, values);

    broadcast(`Profile has been successfully created for user ${userId}`);
}

export async function getUserProfile(userId: string | number): Promise<ProfileData> {
    const userIdStr = userId.toString();

    if (userProfileCache.has(userIdStr)) {
        return userProfileCache.get(userIdStr)!;
    }

    const query = `
        SELECT
            id,
            first_name ,
            last_name ,
            avatar,
            balance,
            spin_count,
            successful_responses_count,
            current_status,
            user_id,
            updated_at
        FROM
            profiles
        WHERE
            user_id = $1 LIMIT 1;
    `;
    const result = await executeQuery(query, [userId]);
    if (result.length === 0) {
        await createUserProfile(userId);
        return await getUserProfile(userId);
    }

    const userProfile = result[0];
    userProfileCache.set(userIdStr, userProfile);
    return userProfile;
}

export async function updateUserProfile(profileData: Partial<ProfileData>): Promise<ProfileData> {
    const updateFields = [];
    const values = [];
    let index = 1;

    if (profileData.first_name) {
        updateFields.push(`first_name = $${index++}`);
        values.push(profileData.first_name);
    }
    if (profileData.last_name) {
        updateFields.push(`last_name = $${index++}`);
        values.push(profileData.last_name);
    }
    if (profileData.avatar) {
        updateFields.push(`avatar = $${index++}`);
        values.push(profileData.avatar);
    }

    updateFields.push(`updated_at = $${index++}`);
    values.push(new Date().toISOString());
    values.push(profileData.user_id);

    const query = `
        UPDATE profiles
        SET ${updateFields.join(', ')}
        WHERE user_id = $${index}
        RETURNING id, first_name , last_name, avatar, updated_at;
    `;
    const result = await executeQuery(query, values);
    if (result.length === 0) throw new Error(`Profile not found for userId: ${profileData.user_id}`);
    invalidateUserProfileCache(profileData.user_id!);
    return result[0];
}


export async function deleteUserProfile(userId: string | number): Promise<void> {
    const query = `DELETE FROM profiles WHERE user_id = $1`;
    await executeQuery(query, [userId]);
    invalidateUserProfileCache(userId);
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
        SELECT COUNT(*)
        FROM ${tableName}
        WHERE vacancy_status = 'true';
    `;

    const updateQuery = `
        UPDATE profiles
        SET successful_responses_count = $1
        WHERE user_id = $2;
    `;

    const result = await executeQuery(countQuery);
    const successfulResponsesCount = parseInt(result[0]?.successful_responses_count || 0, 10);
    await executeQuery(updateQuery, [successfulResponsesCount, userId]);
}
