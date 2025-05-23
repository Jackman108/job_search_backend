import { ProfileData, UserProfileUpdateFields } from '@interface';
import { broadcast } from '@server';
import { executeQuery, generateUpdateQuery, invalidateUserProfileCache, userProfileCache } from '@utils';

async function createUserProfile(userId: string): Promise<void> {
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


export async function getUserProfile(userId: string): Promise<ProfileData> {
    const userIdStr = userId.toString();

    if (userProfileCache.has(userIdStr)) {
        return userProfileCache.get(userIdStr)!;
    }

    const query = `SELECT * FROM profiles WHERE user_id = $1 LIMIT 1;`;
    const result = await executeQuery(query, [userId]);
    if (result.length === 0) {
        await createUserProfile(userId);
        return await getUserProfile(userId);
    }

    const userProfile = result[0];
    userProfileCache.set(userIdStr, userProfile);
    return userProfile;
}


export async function updateUserProfile(
    profileData: UserProfileUpdateFields,
    user_id: string): Promise<void> {
    const { query, values } = generateUpdateQuery(
        "profiles",
        profileData,
        "user_id",
        user_id
    );
    const result = await executeQuery(query, values);
    invalidateUserProfileCache(user_id);
    return result[0];
}


export async function deleteUserProfile(userId: string): Promise<void> {
    const query = `DELETE FROM profiles WHERE user_id = $1`;
    await executeQuery(query, [userId]);
    invalidateUserProfileCache(userId);
}


export async function incrementSpinCount(userId: string): Promise<void> {
    const query = `
        UPDATE profiles
        SET spin_count = spin_count + 1, updated_at = NOW()
        WHERE user_id = $1;
    `;

    await executeQuery(query, [userId]);
}


export async function updateSuccessfulResponsesCount(userId: string): Promise<void> {
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
