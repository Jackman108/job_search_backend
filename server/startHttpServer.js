import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { checkPort } from '../utils/checkPort.js';
import { getUserProfile, getVacanciesUser, createUserProfile, updateUserProfile, createVacancyTable } from '../db.js';
import { runPuppeteerScript } from '../index.js';
import { stop } from '../utils/stopManager.js';
import { personalData } from '../secrets.js';

export const startHttpServer = async (port) => {
    try {
        await checkPort(port);

        const app = express();
        app.use(cors({
            origin: 'http://localhost:3000',
            credentials: true
        })); app.use(bodyParser.json());

        app.post('/start', async (req, res) => {
            try {

                const { userId, email, password, position, message, vacancyUrl } = req.body;
                const userIdToUse = userId;
                const emailToUse = email || personalData.vacancyEmail;
                const passwordToUse = password || personalData.vacancyPassword;
                const positionToUse = position || personalData.vacancySearch;
                const messageToUse = message || personalData.coverLetter;
                const vacancyUrlToUse = vacancyUrl || personalData.vacanciesUrl;

                await runPuppeteerScript({
                    userId: userIdToUse,
                    email: emailToUse,
                    password: passwordToUse,
                    position: positionToUse,
                    message: messageToUse,
                    vacancyUrl: vacancyUrlToUse
                });

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
                const userId = req.params.userId;
                const vacancies = await getVacanciesUser(userId);
                if (vacancies) {
                    res.status(200).json(vacancies);
                } else {
                    res.status(404).json({ message: 'Вакансии не найдены.' });
                }
            } catch (error) {
                console.error('Ошибка получения вакансий по userId:', error);
                res.status(500).json({ message: 'Ошибка получения вакансий по userId.' });
            }
        });


        app.get('/profile/:userId', async (req, res) => {
            try {
                const userId = req.params.userId;
                const profile = await getUserProfile(userId);
                if (profile) {
                    res.status(200).json(profile);
                } else {
                    res.status(404).json({ message: 'Профиль не найден.' });
                }
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
                console.log(profileData);
                res.status(201).json({ message: 'Профиль успешно создан.' });
            } catch (error) {
                console.error('Ошибка создания профиля пользователя:', error);
                res.status(500).json({ message: 'Ошибка создания профиля пользователя.' });
            }
        });


        app.put('/profile/:userId', async (req, res) => {
            try {
                const userId = req.params.userId;
                const { firstName, lastName, avatar } = req.body;

                const updateFields = {};
                if (firstName) updateFields.firstName = firstName;
                if (lastName) updateFields.lastName = lastName;
                if (avatar) updateFields.avatar = avatar;

                const updatedProfile = await updateUserProfile(userId, updateFields);
                if (updatedProfile) {
                    res.status(200).json({
                        message: 'Профиль успешно обновлен.',
                        profile: updatedProfile
                    });
                } else {
                    res.status(404).json({ message: 'Профиль не найден.' });
                }
            } catch (error) {
                console.error('Ошибка обновления профиля пользователя:', error);
                res.status(500).json({ message: 'Ошибка обновления профиля пользователя.' });
            }
        });


        const server = app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });

        return server;
    } catch (err) {
        console.error(`Error starting HTTP server: ${err.message}`);
        throw err;
    }
};
