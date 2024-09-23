// server/routes.ts
import express from 'express';
import { AvatarUploadParams, PuppeteerScriptParams, UserProfileUpdateFields } from '../interface/interface.js';
import { runPuppeteerScript } from '../run/index.js';
import { personalData } from '../secrets.js';
import { createUserProfile, getUserProfile, incrementSpinCount, updateSuccessfulResponsesCount, updateUserProfile } from '../services/profileService.js';
import { createResume, deleteResume, getResumeById, updateResume } from '../services/resumeService.js';
import { createVacancyTable, deleteVacancy, getVacanciesUser } from '../services/vacancyService.js';
import { handleAvatarUpload } from '../utils/avatarUpload.js';
import { stop } from '../utils/stopManager.js';

export const initializeRoutes = (app: express.Application) => {
    app.post('/start', async (req, res) => {
        try {
            const { userId, email, password, position, message, vacancyUrl }: PuppeteerScriptParams = req.body;
            await runPuppeteerScript({
                userId: userId,
                email: email || personalData.vacancyEmail,
                password: password || personalData.vacancyPassword,
                position: position || personalData.vacancySearch,
                message: message || personalData.coverLetter,
                vacancyUrl: vacancyUrl || personalData.vacanciesUrl
            });
            await incrementSpinCount(userId);
            await updateSuccessfulResponsesCount(userId);
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

    app.delete('/vacancy/:userId/:vacancyId', async (req, res) => {
        const { userId, vacancyId } = req.params;
        try {
            await deleteVacancy(vacancyId, userId);
            res.status(200).json({ message: 'Vacancy deleted successfully.' });
        } catch (error) {
            console.error('Error deleting vacancy:', error);
            res.status(500).json({ message: 'Error deleting vacancy.' });
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
            const { firstName, lastName, avatar }: UserProfileUpdateFields = req.body;
            const updateFields: UserProfileUpdateFields = { firstName, lastName };

            if (avatar) {
                const avatarUploadParams: AvatarUploadParams = {
                    avatar,
                    userId: req.params.userId,
                    updateFields
                };
                await handleAvatarUpload(avatarUploadParams.avatar, avatarUploadParams.userId, avatarUploadParams.updateFields);
            }

            const updatedProfile = await updateUserProfile(req.params.userId, updateFields);
            res.status(200).json({ message: 'Профиль успешно обновлен.', profile: updatedProfile });
        } catch (error) {
            console.error('Ошибка обновления профиля пользователя:', error);
            res.status(500).json({ message: 'Ошибка обновления профиля пользователя.' });
        }
    });

    app.post('/resume/:userId', async (req, res) => {
        try {
            const userId = req.params.userId;
            const resumeData = req.body;
            if (!userId || !resumeData || !resumeData.full_name) {
                return res.status(400).json({ message: 'Необходимо указать userId и full_name.' });
            }
            const resume = await createResume(userId, resumeData);
            res.status(201).json({ message: 'Резюме успешно создано.', resume });
        } catch (error) {
            console.error('Ошибка создания резюме:', error);
            res.status(500).json({ message: 'Ошибка создания резюме.' });
        }
    });

    app.get('/resume/:userId', async (req, res) => {
        try {
            const resume = await getResumeById(req.params.userId);
            res.status(resume ? 200 : 404).json(resume || { message: 'Резюме не найдено.' });
        } catch (error) {
            console.error(`Ошибка получения резюме ${req.params.userId}:`, error);
            res.status(500).json({ message: 'Ошибка получения резюме.' });
        }
    });

    app.put('/resume/:userId', async (req, res) => {
        try {
            const userId = req.params.userId;
            const updates = req.body;
            await updateResume(userId, updates);
            res.status(200).json({ message: 'Резюме успешно обновлено.' });
        } catch (error) {
            console.error(`Ошибка обновления резюме ${req.params.userId}:`, error);
            res.status(500).json({ message: 'Ошибка обновления резюме.' });
        }
    });

    app.delete('/resume/:userId', async (req, res) => {
        try {
            const userId = req.params.userId;
            await deleteResume(userId);
            res.status(200).json({ message: 'Резюме успешно удалено.' });
        } catch (error) {
            console.error(`Ошибка удаления резюме ${req.params.userId}:`, error);
            res.status(500).json({ message: 'Ошибка удаления резюме.' });
        }
    });
};
