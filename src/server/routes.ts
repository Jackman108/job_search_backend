// server/routes.ts
import express from 'express';
import { AvatarUploadParams, PuppeteerScriptParams, UserProfileUpdateFields } from '../interface/interface.js';
import { runPuppeteerScript } from '../run/index.js';
import { personalData } from '../secrets.js';
import { createContact, deleteContact, getContactById, updateContact } from '../services/contactService.js';
import { createUserProfile, getUserProfile, incrementSpinCount, updateSuccessfulResponsesCount, updateUserProfile } from '../services/profileService.js';
import { createResume, deleteResume, getResumeById, updateResume } from '../services/resumeService.js';
import { createSkill, deleteSkill, getSkillsByUserId, updateSkill } from '../services/skillService.js';
import { createVacancyTable, deleteVacancy, getVacanciesUser } from '../services/vacancyService.js';
import { handleAvatarUpload } from '../utils/avatarUpload.js';
import { stop } from '../utils/stopManager.js';
import { AuthenticatedRequest, extractUserId, handleErrors, validateDataPresence, validateUserId, validateUserPatch } from './middlewares.js';
import { createWorkExperience, deleteWorkExperience, getWorkExperienceByUserId, updateWorkExperience } from '../services/workExperienceService.js';

export const initializeRoutes = (app: express.Application) => {
    app.post('/start', async (req, res) => {
        try {
            const { userId, email, password, position, message, vacancyUrl }: PuppeteerScriptParams = req.body;
            await runPuppeteerScript({
                userId,
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
            handleErrors(res, error, 'Ошибка выполнения скрипта.');
        }
    });

    app.post('/stop', async (req, res) => {
        try {
            const { browser } = req.body;
            await stop(browser);
            res.status(200).json({ message: 'Скрипт остановлен успешно!' });
        } catch (error) {
            handleErrors(res, error, 'Ошибка остановки скрипта.');
        }
    });

    app.get('/vacancy', extractUserId, async (req: AuthenticatedRequest, res) => {
        try {
            if (!req.userId) {
                return res.status(400).json({ message: 'userId is required.' });
            }
            const vacancies = await getVacanciesUser(req.userId);
            res.status(vacancies ? 200 : 404).json(vacancies || { message: 'Вакансии не найдены.' });
        } catch (error) {
            handleErrors(res, error, 'Ошибка получения вакансий по userId.');
        }
    });

    app.delete('/vacancy/:vacancyId', extractUserId, async (req: AuthenticatedRequest, res) => {
        if (!req.userId) {
            return res.status(400).json({ message: 'userId is required.' });
        }
        try {
            await deleteVacancy(req.params.vacancyId, req.userId);
            res.status(200).json({ message: 'Вакансия удалена успешно.' });
        } catch (error) {
            handleErrors(res, error, 'Ошибка удаления вакансии.');
        }
    });

    app.get('/profile', extractUserId, async (req: AuthenticatedRequest, res) => {
        if (!req.userId) {
            return res.status(400).json({ message: 'userId is required.' });
        }
        try {
            const profile = await getUserProfile(req.userId);
            res.status(profile ? 200 : 404).json(profile || { message: 'Профиль не найден.' });
        } catch (error) {
            handleErrors(res, error, 'Ошибка получения профиля пользователя.');
        }
    });

    app.post('/profile', async (req, res) => {
        try {
            await createUserProfile(req.body);
            await createVacancyTable(req.body);
            res.status(201).json({ message: 'Профиль успешно создан.' });
        } catch (error) {
            handleErrors(res, error, 'Ошибка создания профиля пользователя.');
        }
    });

    app.put('/profile', async (req, res) => {
        try {
            const { avatar, ...updateFields }: UserProfileUpdateFields = req.body;
            if (avatar) {
                const avatarUploadParams: AvatarUploadParams = { avatar, updateFields };
                await handleAvatarUpload(avatarUploadParams.avatar, avatarUploadParams.updateFields);
            }
            const updatedProfile = await updateUserProfile(updateFields);
            res.status(200).json({ message: 'Профиль успешно обновлен.', profile: updatedProfile });
        } catch (error) {
            handleErrors(res, error, 'Ошибка обновления профиля пользователя.');
        }
    });

    app.post('/resume/:userId', validateUserId, async (req, res) => {
        validateDataPresence(req, res, ['full_name']);
        try {
            const resume = await createResume(req.params.userId, req.body);
            res.status(201).json({ message: 'Резюме успешно создано.', resume });
        } catch (error) {
            handleErrors(res, error, 'Ошибка создания резюме.');
        }
    });

    app.get('/resume/:userId', validateUserPatch, async (req, res) => {

        try {
            const resume = await getResumeById(req.params.userId);
            res.status(resume ? 200 : 404).json(resume || { message: 'Резюме не найдено.' });
        } catch (error) {
            handleErrors(res, error, 'Ошибка получения резюме.');
        }
    });

    app.put('/resume/:userId', validateUserPatch, async (req, res) => {
        try {
            const userId = req.params.userId;
            const updates = req.body;
            await updateResume(userId, updates);
            res.status(200).json({ message: 'Резюме успешно обновлено.' });
        } catch (error) {
            handleErrors(res, error, 'Ошибка обновления резюме.');
        }
    });

    app.delete('/resume/:userId', validateUserPatch, async (req, res) => {
        try {
            const userId = req.params.userId;
            await deleteResume(userId);
            res.status(200).json({ message: 'Резюме успешно удалено.' });
        } catch (error) {
            handleErrors(res, error, 'Ошибка удаления резюме.');
        }
    });

    app.post('/contacts/:userId', validateUserPatch, async (req, res) => {
        validateDataPresence(req, res, ['phone']);
        try {
            const contact = await createContact(req.params.userId, req.body);
            res.status(201).json({ message: 'Контакты успешно созданы.', contact });
        } catch (error) {
            handleErrors(res, error, 'Ошибка создания контактов.');
        }
    });

    app.get('/contacts/:userId', validateUserPatch, async (req, res) => {
        try {
            const contact = await getContactById(req.params.userId);
            res.status(contact ? 200 : 404).json(contact || { message: 'Контакты не найдены.' });
        } catch (error) {
            handleErrors(res, error, 'Ошибка получения контактов.');
        }
    });

    app.put('/contacts/:userId', validateUserPatch, async (req, res) => {
        try {
            await updateContact(req.params.userId, req.body);
            res.status(200).json({ message: 'Контакты успешно обновлены.' });
        } catch (error) {
            handleErrors(res, error, 'Ошибка обновления контактов.');;
        }
    });

    app.delete('/contacts/:userId', validateUserPatch, async (req, res) => {
        try {
            await deleteContact(req.params.userId);
            res.status(200).json({ message: 'Контакты успешно удалены.' });
        } catch (error) {
            handleErrors(res, error, 'Ошибка удаления контактов.');
        }
    });

    app.post('/skills/:userId', validateUserPatch, async (req, res) => {
        try {
            const skill = await createSkill(req.params.userId, req.body);
            res.status(201).json({ message: 'Навык успешно создан.', skill });
        } catch (error) {
            handleErrors(res, error, 'Ошибка создания навыка.');
        }
    });

    app.get('/skills/:userId', validateUserPatch, async (req, res) => {
        try {
            const skills = await getSkillsByUserId(req.params.userId);
            res.status(skills.length ? 200 : 404).json(skills.length ? skills : { message: 'Навыки не найдены.' });
        } catch (error) {
            handleErrors(res, error, 'Ошибка получения навыков.');
        }
    });

    app.put('/skills/:userId/:skillId', validateUserPatch, async (req, res) => {
        try {
            await updateSkill(req.params.userId, req.params.skillId, req.body);
            res.status(200).json({ message: 'Навык успешно обновлен.' });
        } catch (error) {
            handleErrors(res, error, 'Ошибка обновления навыка.');
        }
    });

    app.delete('/skills/:userId/:skillId', validateUserPatch, async (req, res) => {
        try {
            await deleteSkill(req.params.userId, req.params.skillId);
            res.status(200).json({ message: 'Навык успешно удален.' });
        } catch (error) {
            handleErrors(res, error, 'Ошибка удаления навыка.');
        }
    });
    
    app.post('/work_experience/:userId', validateUserPatch, async (req, res) => {
        try {
            const workExperience = await createWorkExperience(req.params.userId, req.body);
            res.status(201).json({ message: 'Опыт успешно создан.', workExperience });
        } catch (error) {
            handleErrors(res, error, 'Ошибка создания опыта.');
        }
    });

    app.get('/work_experience/:userId', validateUserPatch, async (req, res) => {
        try {
            const workExperience = await getWorkExperienceByUserId(req.params.userId);
            res.status(workExperience.length ? 200 : 404).json(workExperience.length ? workExperience : { message: 'Опыты не найдены.' });
        } catch (error) {
            handleErrors(res, error, 'Ошибка получения опыта.');
        }
    });

    app.put('/work_experience/:userId/:experienceId', validateUserPatch, async (req, res) => {
        try {
            await updateWorkExperience(req.params.userId, req.params.experienceId, req.body);
            res.status(200).json({ message: 'Опыт успешно обновлен.' });
        } catch (error) {
            handleErrors(res, error, 'Ошибка обновления опыта.');
        }
    });

    app.delete('/work_experience/:userId/:experienceId', validateUserPatch, async (req, res) => {
        try {
            await deleteWorkExperience(req.params.userId, req.params.experienceId);
            res.status(200).json({ message: 'Опыт успешно удален.' });
        } catch (error) {
            handleErrors(res, error, 'Ошибка удаления опыта.');
        }
    });


};
