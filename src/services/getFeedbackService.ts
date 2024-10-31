// feedbackService.ts
import client from '../config/dbConfig.js';
import { ChatData } from '../interface/interface.js';
import { broadcast } from '../server/startWebSocketServer.js';

export const createFeedbackTable = async (userId: string | number): Promise<void> => {
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

    try {
        await client.query(createTableQuery);
        console.log(`Table ${tableName} created or already exists.`);
    } catch (err) {
        console.error(`Error creating table ${tableName}:`, err);
        throw err;
    }
};

export const saveFeedback = async (data: ChatData, userId: string | number): Promise<void> => {
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

export const getFeedbacksForUser = async (userId: string | number): Promise<any[]> => {
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

export const deleteFeedback = async (feedbackId: string | number, userId: string | number): Promise<void> => {
    const tableName = `"${userId}_feedbacks"`;
    const deleteQuery = `DELETE FROM ${tableName} WHERE id = $1;`;

    try {
        await client.query(deleteQuery, [feedbackId]);
        broadcast(`Feedback with ID ${feedbackId} has been successfully deleted.`);
    } catch (err) {
        console.error('Error when deleting feedback:', err);
    }
};

export const deleteFeedbackTable = async (userId: string | number): Promise<void> => {
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
/*
шаг 2 по аналогии с runPuppeteerScript нужно сделать скрипт который:
переходит по ссылкам 
<a class="Tb0DXML___chat-cell" data-qa="chatik-open-chat-4116581635" href="/chat/4116581635"><div><div class="magritte-avatar___x--BK_5-0-9 magritte-avatar_shape-circle___kEbru_5-0-9 magritte-avatar_mode-image___02zr1_5-0-9 magritte-avatar_size-48___JzITc_5-0-9" aria-label="Майнд Форс"><img alt="Майнд Форс" class="magritte-avatar-image___05p9Z_5-0-9" src="https://img.hhcdn.ru/employer-logo/6820843.png"></div></div><div class="qLP4ab0___content"><div class="Hby41cy___row"><div class="O7cpcLy___title-wrapper"><div class="vgIcxaV___title">Middle+ Backend Developer / PHP разработчик (Symfony)</div></div><div class="aTo3dSl___meta"><div class="JrbfgHB___time">пт</div></div></div><div class="tMAs5VY___subtitle">Майнд Форс</div><div class="Hby41cy___row EHQuCu0___last-message-wrapper"><div class="yrXp3OL___last-message"><div class="yAgPNwB___last-message ZbZG88N___last-message-color_red">Отказ</div></div></div></div></a> и собирает их в массив по id чата, 
4127848938 -может быть любым,
если ссылка содержит отказ или приглажение кликаем на нее
на открывшейся странице собираем vacancy_id, feedback_text, feedback_date, response_status,
далее кликаем по отобранным чатам и делаем тоже самое пока не закончаться
*/