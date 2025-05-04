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
            response_status VARCHAR(50)
        );
    `;

    await executeQuery(createTableQuery);
};


export async function deleteFeedbackTable(userId: string): Promise<void> {
    await deleteTable(userId, 'feedbacks');
}


export const saveChatFeedback = async (data: FeedbackData, userId: string): Promise<void> => {
    const tableName = `"${userId}_feedbacks"`;

    const insertOrUpdateQuery = `
    INSERT INTO ${tableName} (id, vacancy_id, feedback_text, feedback_date, response_status)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (id) DO UPDATE 
    SET vacancy_id = $2, feedback_text = $3, feedback_date = $4, response_status = $5;
`;

    const values = [
        data.id,
        data.vacancy_id,
        data.feedback_text,
        data.feedback_date,
        data.response_status,
    ];

    await executeQuery(insertOrUpdateQuery, values);
};


export const getChatFeedback = async (userId: string): Promise<any[]> => {
    const tableName = `"${userId}_feedbacks"`;
    const exists = await checkTableExists(tableName);
    if (!exists) {
        await createChatFeedbackTable(userId);
    }

    const query = `SELECT * FROM ${tableName}`;
    const rows = await executeQuery(query);

    return rows.length > 0 ? rows : [];
};


export const deleteChatFeedback = async (userId: string, feedbackId: number): Promise<void> => {
    const tableName = `"${userId}_feedbacks"`;
    const deleteQuery = `DELETE FROM ${tableName} WHERE id = $1;`;

    await executeQuery(deleteQuery, [feedbackId]);
    broadcast(`Feedback with ID ${feedbackId} has been successfully deleted.`);
};


