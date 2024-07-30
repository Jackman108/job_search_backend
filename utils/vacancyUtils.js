export async function extractVacancyData(page, { vacancyTitle, vacancyLink, companyTitle, companyLink }) {
    const id = vacancyLink.match(/\/(\d+)\?/)?.[1] || '';
    
    const vacancyTitleText = vacancyTitle || 'Заголовок не найден';
    const vacancyLinkText = vacancyLink || 'Ссылка не найдена';
    const companyTitleText = companyTitle || 'Название компании не найдено';
    const companyLinkText = companyLink || 'Ссылка на компанию не найдена';

    const vacancyStatus = false;
    const responseDate = new Date().toISOString();
    
    return { id, vacancyTitleText, vacancyLinkText, companyTitleText, companyLinkText, vacancyStatus, responseDate };
}
