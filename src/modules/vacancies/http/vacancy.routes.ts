import express from 'express';
import { registerRoute } from '@middlewares';
import { VacancyController } from './VacancyController.js';

export function registerVacancyRoutes(app: express.Application): void {
    /**
     * @swagger
     * /vacancy:
     *   get:
     *     summary: Получить список вакансий
     *     tags: [Вакансии]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Список вакансий (может быть пустым массивом)
     *       401:
     *         description: Не авторизован
     */
    registerRoute(app, 'get', '/vacancy', VacancyController, 'getVacancies');

    /**
     * @swagger
     * /vacancy/{vacancyId}:
     *   delete:
     *     summary: Удалить вакансию
     *     tags: [Вакансии]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: vacancyId
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Вакансия успешно удалена
     *       404:
     *         description: Вакансия не найдена
     */
    registerRoute(app, 'delete', '/vacancy/:vacancyId', VacancyController, 'deleteVacancy');

    /**
     * @swagger
     * /default/vacancies:
     *   delete:
     *     summary: Удалить все вакансии
     *     tags: [Вакансии]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Все вакансии успешно удалены
     */
    registerRoute(app, 'delete', '/default/vacancies', VacancyController, 'deleteVacanciesTable');
}
