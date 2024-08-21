import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { checkPort } from '../utils/checkPort.js';
import { getUserProfile, getVacancies } from '../db.js';
import { runPuppeteerScript } from '../index.js';
import { stop } from '../utils/stopManager.js';
import { personalData } from '../secrets.js';
import { verifyToken } from '../utils/verifyToken.js';

export const startHttpServer = async (port) => {
    try {
        await checkPort(port);

        const app = express();
        app.use(cors());
        app.use(bodyParser.json());

        app.post('/start', async (req, res) => {
            try {

                const { userId, email, password, position, message, vacancyUrl } = req.body;
                const userIdToUse = userId || personalData.userId;
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

        app.get('/profiles/:id', verifyToken, async (req, res) => {
            const { email } = req.body;
            if (!email) {
                return res.status(400).json({ message: 'Не указан email.' });
            }
            try {
                const userProfile = await getUserProfile(email);
                if (!userProfile) {
                    return res.status(404).json({ message: 'Профиль пользователя не найден' });
                }
                res.status(200).json(profile);
            } catch (error) {
                console.error('Ошибка получения профиля:', error);
                res.status(500).json({ message: 'Ошибка получения профиля.' });
            }
        });
        app.post('/vacancies/user/:userId', verifyToken, async (req, res) => {
            try {
                const userId = parseInt(req.params.userId, 10);
                if (isNaN(userId)) {
                    return res.status(400).json({ message: 'Неверный формат userId.' });
                }
                // Можно использовать req.userId для доступа к проверенному идентификатору
                const vacancies = await getVacancies(userId);
                res.status(200).json(vacancies);
            } catch (error) {
                console.error('Ошибка получения вакансий по userId:', error);
                res.status(500).json({ message: 'Ошибка получения вакансий по userId.' });
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
