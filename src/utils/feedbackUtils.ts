// src/utils/vacancyUtils.ts
import {ExtractChatDataParams, ExtractFeedbackData, FeedbackData} from '../interface/interface.js';

export async function extractChatId({chatUrl}: ExtractChatDataParams): Promise<{ chatId: number; }> {
    const chatId = Number(chatUrl.match(/\/chat\/(\d+)/)?.[1]) || 0;
    return {chatId};

}

export async function extractFeedbackData({
                                              chatId,
                                              url_vacancy,
                                              response_status,
                                              feedback_text,
                                              feedback_date,
                                              feedback_time
                                          }: ExtractFeedbackData): Promise<FeedbackData> {

    if (!feedback_date || !feedback_time) {
        console.error('Invalid feedback date or time:', feedback_date, feedback_time);
        throw new Error('Feedback date or time is missing');
    }
    const vacancyId = Number(url_vacancy.match(/\/vacancy\/(\d+)/)?.[1]) || 0;

    const feedbackDate = parseDate(feedback_date, feedback_time);
    let status = 'Не рассмотрен';
    if (response_status.includes('Приглашение')) {
        status = 'Приглашение';
    } else if (response_status.includes('Отказ')) {
        status = 'Отказ';
    }
    return {
        id: chatId,
        vacancy_id: vacancyId,
        feedback_text,
        feedback_date: feedbackDate,
        response_status: status,
    };

}


function parseDate(feedbackDate: string | undefined, feedbackTime: string | undefined): Date {
    const now = new Date();

    if (!feedbackDate || !feedbackTime) {
        throw new Error('Feedback date or time is missing');
    }

    const timeMatch = feedbackTime.match(/^(\d{1,2}):(\d{2})$/);
    if (!timeMatch) {
        throw new Error(`Invalid time format: ${feedbackTime}`);
    }

    const [hours, minutes] = feedbackTime.split(':').map(Number);

    if (feedbackDate.toLowerCase() === 'сегодня') {
        now.setHours(hours, minutes, 0, 0);
        return now;
    }

    if (feedbackDate.toLowerCase() === 'вчера') {
        now.setDate(now.getDate() - 1);
        now.setHours(hours, minutes, 0, 0);
        return now;
    }

    const [day, monthName] = feedbackDate.split(' ');
    const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    const month = months.indexOf(monthName.toLowerCase());

    return new Date(now.getFullYear(), month, Number(day), hours, minutes);
}
