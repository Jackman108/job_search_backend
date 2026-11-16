import { FeedbackData } from '@interface';
import { checkTableExists, deleteTable, executeQuery } from '@utils';
import { broadcast } from '@server';

export const createChatFeedbackTable = async (userId: string): Promise<void> => {
    const tableName = `"${userId}_feedbacks"`;

    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS ${tableName} (
            id BIGINT PRIMARY KEY,
            vacancy_id BIGINT NOT NULL,
            feedback_text TEXT,
            feedback_date TIMESTAMP DEFAULT NOW(),
            response_status VARCHAR(50),
            title_vacancy VARCHAR(255),
            title_company VARCHAR(255)
        );
    `;

    await executeQuery(createTableQuery);
    await executeQuery(`ALTER TABLE ${tableName} ADD COLUMN IF NOT EXISTS title_vacancy VARCHAR(255)`);
    await executeQuery(`ALTER TABLE ${tableName} ADD COLUMN IF NOT EXISTS title_company VARCHAR(255)`);
};

export async function deleteFeedbackTable(userId: string): Promise<void> {
    await deleteTable(userId, 'feedbacks');
}

export const saveChatFeedback = async (data: FeedbackData, userId: string): Promise<void> => {
    const tableName = `"${userId}_feedbacks"`;
    await createChatFeedbackTable(userId);

    const insertOrUpdateQuery = `
    INSERT INTO ${tableName} (id, vacancy_id, feedback_text, feedback_date, response_status, title_vacancy, title_company)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (id) DO UPDATE
    SET vacancy_id = CASE WHEN $2 = 0 THEN ${tableName}.vacancy_id ELSE $2 END,
        feedback_text = CASE WHEN $3 = '' THEN ${tableName}.feedback_text ELSE $3 END,
        feedback_date = $4,
        response_status = $5,
        title_vacancy = COALESCE(NULLIF($6, ''), ${tableName}.title_vacancy),
        title_company = COALESCE(NULLIF($7, ''), ${tableName}.title_company);
`;

    const values = [
        data.id,
        data.vacancy_id,
        data.feedback_text,
        data.feedback_date,
        data.response_status,
        data.title_vacancy || null,
        data.title_company || null,
    ];

    await executeQuery(insertOrUpdateQuery, values);
};

export const getChatFeedback = async (userId: string): Promise<any[]> => {
    const tableName = `"${userId}_feedbacks"`;
    // Always ensure table + title_* columns exist (CREATE IF NOT EXISTS + ALTER ADD IF NOT EXISTS).
    // Skipping ALTER on existing tables made GET /feedback 500 after title columns shipped.
    await createChatFeedbackTable(userId);

    const vacancyTable = `"${userId}_vacancy"`;
    const vacancyExists = await checkTableExists(vacancyTable);
    const query = vacancyExists
        ? `SELECT f.id,
                  f.vacancy_id,
                  f.feedback_text,
                  f.feedback_date,
                  f.response_status,
                  COALESCE(f.title_vacancy, v.title_vacancy) AS title_vacancy,
                  COALESCE(f.title_company, v.title_company) AS title_company
           FROM ${tableName} f
           LEFT JOIN ${vacancyTable} v ON v.id = f.vacancy_id
           ORDER BY f.feedback_date DESC NULLS LAST`
        : `SELECT id, vacancy_id, feedback_text, feedback_date, response_status, title_vacancy, title_company
           FROM ${tableName}
           ORDER BY feedback_date DESC NULLS LAST`;
    const rows = await executeQuery(query);

    return rows.length > 0 ? rows : [];
};

export const deleteChatFeedback = async (userId: string, feedbackId: number): Promise<void> => {
    const tableName = `"${userId}_feedbacks"`;
    const deleteQuery = `DELETE FROM ${tableName} WHERE id = $1;`;

    await executeQuery(deleteQuery, [feedbackId]);
    broadcast(`Feedback with ID ${feedbackId} has been successfully deleted.`);
};
