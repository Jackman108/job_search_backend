import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { checkPort } from '../utils/checkPort.js';
import { getList } from '../db.js';
import { runPuppeteerScript } from '../index.js';
import { stop } from '../utils/stopManager.js';
import { personalData } from '../secrets.js';

export const startHttpServer = async (port) => {
    try {
        await checkPort(port);

        const app = express();
        app.use(cors());
        app.use(bodyParser.json());

        app.post('/start', async (req, res) => {
            try {

                const { email, password, position, message, vacancyUrl } = req.body;
                const emailToUse = email || personalData.vacancyEmail;
                const passwordToUse = password || personalData.vacancyPassword;
                const positionToUse = position || personalData.vacancySearch;
                const messageToUse = message || personalData.coverLetter;
                const vacancyUrlToUse = vacancyUrl || personalData.vacanciesUrl;

                await runPuppeteerScript({
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

        app.get('/data', async (req, res) => {
            try {
                const vacancies = await getList();
                res.status(200).json(vacancies);
            } catch (error) {
                console.error('Ошибка получения данных:', error);
                res.status(500).json({ message: 'Ошибка получения данных.' });
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
