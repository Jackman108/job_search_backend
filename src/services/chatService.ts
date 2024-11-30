// feedbackService.ts
import client from '../config/dbConfig.js';
import { ChatData } from '../interface/interface.js';
import { broadcast } from '../server/startWebSocketServer.js';

export const createChatFeedbackTable = async (userId: string | number): Promise<void> => {
    const id = userId.toString();
    const tableName = `"${id}_feedbacks"`;

    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS ${tableName} (
            id BIGINT PRIMARY KEY,
            vacancy_id BIGINT NOT NULL,
            feedback_text TEXT,
            feedback_date TIMESTAMP DEFAULT NOW(),
            response_status VARCHAR(50)
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

export const deleteChatFeedbackTable = async (userId: string | number): Promise<void> => {
    const tableName = `"${userId}_feedbacks"`;
    const query = `DROP TABLE IF EXISTS ${tableName}`;

    try {
        await client.query(query);
        console.log(`Table ${tableName} deleted.`);
    } catch (err) {
        console.error(`Error when dropping feedback table ${tableName}:`, err);
        throw err;
    }
};

export const saveChatFeedback = async (data: ChatData, userId: string | number): Promise<void> => {
    const tableName = `"${userId}_feedbacks"`;
    const insertOrUpdateQuery = `
    INSERT INTO ${tableName} (id, vacancy_id, feedback_text, feedback_date, response_status)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (id) DO UPDATE 
    SET feedback_text = $2, feedback_date = $3, feedback_date = $4, response_status = $5;
`;
    const values = [
        data.id,
        data.vacancy_id,
        data.feedback_text,
        data.feedback_date,
        data.response_status,
    ];
    try {
        await client.query(insertOrUpdateQuery, values);
        broadcast(`Feedback has been successfully saved with ID ${data.id}`);
    } catch (err) {
        console.error('Error when saving feedback:', err);
    }
};

export const getChatFeedback = async (userId: string | number): Promise<any[]> => {
    const tableName = `"${userId}_feedbacks"`;
    const query = `SELECT * FROM ${tableName}`;

    try {
        const result = await client.query(query);
        return result.rows.length > 0 ? result.rows : [];
    } catch (err) {
        console.error(`Error retrieving feedbacks for user ${userId}:`, err);
        throw err;
    }
};

export const deleteChatFeedback = async (feedbackId: string | number, userId: string | number): Promise<void> => {
    const tableName = `"${userId}_feedbacks"`;
    const deleteQuery = `DELETE FROM ${tableName} WHERE id = $1;`;

    try {
        await client.query(deleteQuery, [feedbackId]);
        broadcast(`Feedback with ID ${feedbackId} has been successfully deleted.`);
    } catch (err) {
        console.error('Error when deleting feedback:', err);
    }
};


