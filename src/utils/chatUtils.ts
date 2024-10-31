// src/utils/vacancyUtils.ts
import { ExtractChatDataParams, ExtractVacancyDataParams, ChatData, VacancyData, ExtractFeedbackData } from '../interface/interface.js';

export async function extractChatId({ chatUrl }: ExtractChatDataParams): Promise<{ chatId: number; }> {
    const chatId = Number(chatUrl.match(/\/chat\/(\d+)/)?.[1]) || 0;
    return { chatId };

}

export async function extractFeedbackData({
    chatId, url_vacancy, response_status, feedback_text, feedback_date, feedback_time
}: ExtractFeedbackData): Promise<ChatData> {
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

function parseDate(feedbackDate: string, feedbackTime: string): Date {
    const now = new Date();
    
    // Получаем часы и минуты из строки времени
    const [hours, minutes] = feedbackTime.split(':').map(Number);

    // Если дата - "сегодня"
    if (feedbackDate === 'сегодня') {
        now.setHours(hours, minutes, 0, 0);
        return now;
    }

    // Если дата - "вчера"
    if (feedbackDate === 'вчера') {
        now.setDate(now.getDate() - 1);
        now.setHours(hours, minutes, 0, 0);
        return now;
    }

    // Если дата в формате "29 октября"
    const [day, monthName] = feedbackDate.split(' ');
    const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    const month = months.indexOf(monthName.toLowerCase());

    // Создаем новую дату с учётом времени
    const parsedDate = new Date(now.getFullYear(), month, Number(day), hours, minutes);
    return parsedDate;
}
