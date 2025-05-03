// src/utils/vacancyUtils.ts
import { ExtractVacancyDataParams, VacancyData } from '../interface/index.js';

export async function extractVacancyData({
    title_vacancy, url_vacancy, title_company, url_company
}: ExtractVacancyDataParams): Promise<VacancyData> {
    const id = Number(url_vacancy.match(/\/(\d+)\?/)?.[1]) || 0;

    const responseDate = new Date();
    responseDate.setHours(responseDate.getHours() + 6);

    return {
        id,
        title_vacancy: title_vacancy || 'Заголовок не найден',
        url_vacancy: url_vacancy || 'Ссылка не найдена',
        title_company: title_company || 'Название компании не найдено',
        url_company: url_company || 'Ссылка на компанию не найдена',
        vacancy_status: 'false',
        response_date: responseDate.toISOString()
    };
}
