import type { FeedbackData } from '@market-hunter/hh-worker/types';
import { broadcast } from '@server';
import { executeQuery } from '../../../utils/index.js';
import { vacancyTableIdent } from '../../vacancies/index.js';
import { feedbackTableIdent } from '../module.config.js';

export async function ensureFeedbacksTable(): Promise<void> {
    const tableName = feedbackTableIdent();
    await executeQuery(`
        CREATE TABLE IF NOT EXISTS ${tableName} (
            user_id UUID NOT NULL,
            id BIGINT NOT NULL,
            vacancy_id BIGINT NOT NULL,
            feedback_text TEXT,
            feedback_date TIMESTAMP DEFAULT NOW(),
            response_status VARCHAR(50),
            title_vacancy VARCHAR(255),
            title_company VARCHAR(255),
            PRIMARY KEY (user_id, id)
        );
    `);
}

/** @deprecated Use ensureFeedbacksTable — kept for call-site compatibility. */
export const createChatFeedbackTable = async (_userId: string): Promise<void> => {
    await ensureFeedbacksTable();
};

/** Clear all feedback rows for the user (does not drop the shared table). */
export async function deleteFeedbackTable(userId: string): Promise<void> {
    const tableName = feedbackTableIdent();
    await ensureFeedbacksTable();
    await executeQuery(`DELETE FROM ${tableName} WHERE user_id = $1`, [userId]);
    broadcast(`Feedbacks cleared for user ${userId}`);
}

export const saveChatFeedback = async (data: FeedbackData, userId: string): Promise<void> => {
    const tableName = feedbackTableIdent();
    await ensureFeedbacksTable();

    const insertOrUpdateQuery = `
    INSERT INTO ${tableName} (
        user_id, id, vacancy_id, feedback_text, feedback_date, response_status, title_vacancy, title_company
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (user_id, id) DO UPDATE
    SET vacancy_id = CASE WHEN $3 = 0 THEN ${tableName}.vacancy_id ELSE $3 END,
        feedback_text = CASE WHEN $4 = '' THEN ${tableName}.feedback_text ELSE $4 END,
        feedback_date = $5,
        response_status = $6,
        title_vacancy = COALESCE(NULLIF($7, ''), ${tableName}.title_vacancy),
        title_company = COALESCE(NULLIF($8, ''), ${tableName}.title_company);
`;

    await executeQuery(insertOrUpdateQuery, [
        userId,
        data.id,
        data.vacancy_id,
        data.feedback_text,
        data.feedback_date,
        data.response_status,
        data.title_vacancy || null,
        data.title_company || null,
    ]);
};

const BAD_TITLE_SQL = `LOWER(TRIM(COALESCE(f.title_vacancy, ''))) IN ('перейти','открыть','смотреть','подробнее','vacancy','вакансия')`;

export const getChatFeedback = async (userId: string): Promise<any[]> => {
    const tableName = feedbackTableIdent();
    const vacancyTable = vacancyTableIdent();
    await ensureFeedbacksTable();

    await executeQuery(`UPDATE ${tableName} f SET title_vacancy = NULL WHERE user_id = $1 AND ${BAD_TITLE_SQL}`, [
        userId,
    ]);

    // List-sync often writes vacancy_id=0 before chat open; link by title so Home
    // vacancies table can show Приглашение/Отказ (same titles as feedback page).
    // Title-only: company strings often differ (HH «ИП …» vs chatik short name).
    await executeQuery(
        `
            UPDATE ${tableName} f
            SET vacancy_id = v.id
            FROM ${vacancyTable} v
            WHERE f.user_id = $1
              AND v.user_id = f.user_id
              AND (f.vacancy_id IS NULL OR f.vacancy_id = 0)
              AND NULLIF(TRIM(f.title_vacancy), '') IS NOT NULL
              AND LOWER(TRIM(REPLACE(f.title_vacancy, CHR(160), ' ')))
                = LOWER(TRIM(REPLACE(v.title_vacancy, CHR(160), ' ')))
        `,
        [userId],
    );

    await executeQuery(
        `
            UPDATE ${tableName} f
            SET title_vacancy = COALESCE(NULLIF(TRIM(v.title_vacancy), ''), f.title_vacancy),
                title_company = COALESCE(NULLIF(TRIM(v.title_company), ''), f.title_company)
            FROM ${vacancyTable} v
            WHERE f.user_id = $1
              AND v.user_id = f.user_id
              AND v.id = f.vacancy_id
              AND (
                NULLIF(TRIM(v.title_vacancy), '') IS NOT NULL
                OR NULLIF(TRIM(v.title_company), '') IS NOT NULL
              )
              AND (
                f.title_vacancy IS DISTINCT FROM v.title_vacancy
                OR f.title_company IS DISTINCT FROM v.title_company
                OR f.title_vacancy IS NULL
                OR f.title_company IS NULL
              )
        `,
        [userId],
    );

    const rows = await executeQuery(
        `
           SELECT f.id,
                  f.vacancy_id,
                  f.feedback_text,
                  f.feedback_date,
                  f.response_status,
                  COALESCE(NULLIF(TRIM(v.title_vacancy), ''), NULLIF(TRIM(f.title_vacancy), '')) AS title_vacancy,
                  COALESCE(NULLIF(TRIM(v.title_company), ''), NULLIF(TRIM(f.title_company), '')) AS title_company
           FROM ${tableName} f
           LEFT JOIN ${vacancyTable} v ON v.user_id = f.user_id AND v.id = f.vacancy_id
           WHERE f.user_id = $1
           ORDER BY f.feedback_date DESC NULLS LAST
        `,
        [userId],
    );

    return rows.length > 0 ? rows : [];
};

export const deleteChatFeedback = async (userId: string, feedbackId: number): Promise<void> => {
    const tableName = feedbackTableIdent();
    await executeQuery(`DELETE FROM ${tableName} WHERE user_id = $1 AND id = $2`, [userId, feedbackId]);
    broadcast(`Feedback with ID ${feedbackId} has been successfully deleted.`);
};
