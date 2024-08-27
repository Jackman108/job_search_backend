// server/routes.js
import { runPuppeteerScript } from '../index.js';
import { stop } from '../utils/stopManager.js';
import { personalData } from '../secrets.js';
import { handleAvatarUpload } from '../utils/avatarUpload.js';
import { getUserProfile, getVacanciesUser, createUserProfile, updateUserProfile, createVacancyTable, incrementSpinCount } from '../db.js';

export const initializeRoutes = (app) => {
    app.post('/start', async (req, res) => {
        try {
            const { userId, email, password, position, message, vacancyUrl } = req.body;
            await runPuppeteerScript({
                userId: userId,
                email: email || personalData.vacancyEmail,
                password: password || personalData.vacancyPassword,
                position: position || personalData.vacancySearch,
                message: message || personalData.coverLetter,
                vacancyUrl: vacancyUrl || personalData.vacanciesUrl
            });
            await incrementSpinCount(userId);
            res.status(200).json({ message: 'Скрипт выполнен успешно!' });
        } catch (error) {
            console.error('Ошибка выполнения скрипта:', error);
            res.status(500).json({ message: 'Ошибка выполнения скрипта.' });
        }
    });

    app.post('/stop', async (req, res) => {
        try {
            const { browser } = req.body;
            await stop(browser);
            res.status(200).json({ message: 'Скрипт остановлен успешно!' });
        } catch (error) {
            console.error('Ошибка остановки скрипта:', error);
            res.status(500).json({ message: 'Ошибка остановки скрипта.' });
        }
    });

    app.get('/vacancy/:userId', async (req, res) => {
        try {
            const vacancies = await getVacanciesUser(req.params.userId);
            res.status(vacancies ? 200 : 404).json(vacancies || { message: 'Вакансии не найдены.' });
        } catch (error) {
            console.error('Ошибка получения вакансий по userId:', error);
            res.status(500).json({ message: 'Ошибка получения вакансий по userId.' });
        }
    });

    app.get('/profile/:userId', async (req, res) => {
        try {
            const profile = await getUserProfile(req.params.userId);
            res.status(profile ? 200 : 404).json(profile || { message: 'Профиль не найден.' });
        } catch (error) {
            console.error('Ошибка получения профиля пользователя:', error);
            res.status(500).json({ message: 'Ошибка получения профиля пользователя.' });
        }
    });

    app.post('/profile', async (req, res) => {
        try {
            const profileData = req.body;
            await createUserProfile(profileData);
            await createVacancyTable(profileData);
            res.status(201).json({ message: 'Профиль успешно создан.' });
        } catch (error) {
            console.error('Ошибка создания профиля пользователя:', error);
            res.status(500).json({ message: 'Ошибка создания профиля пользователя.' });
        }
    });

    app.put('/profile/:userId', async (req, res) => {
        try {
            const { firstName, lastName, avatar } = req.body;
            const updateFields = { firstName, lastName };

            if (avatar) {
                await handleAvatarUpload(avatar, req.params.userId, updateFields);
            }

            const updatedProfile = await updateUserProfile(req.params.userId, updateFields);
            res.status(200).json({ message: 'Профиль успешно обновлен.', profile: updatedProfile });
        } catch (error) {
            console.error('Ошибка обновления профиля пользователя:', error);
            res.status(500).json({ message: 'Ошибка обновления профиля пользователя.' });
        }
    });
};
