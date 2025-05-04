import { VacancyController, FeedbackController } from '@controllers';
import express from 'express';
import { registerRoute } from '@middlewares';

export const initializeJobRoutes = (app: express.Application) => {
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
     *         description: Список вакансий успешно получен
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
     *       401:
     *         description: Не авторизован
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
     *       401:
     *         description: Не авторизован
     */
    registerRoute(app, 'delete', '/default/vacancies', VacancyController, 'deleteVacanciesTable');

    /**
     * @swagger
     * /feedback:
     *   get:
     *     summary: Получить список отзывов
     *     tags: [Отзывы]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Список отзывов успешно получен
     *       401:
     *         description: Не авторизован
     */
    registerRoute(app, 'get', '/feedback', FeedbackController, 'getFeedback');

    /**
     * @swagger
     * /feedback/{feedbackId}:
     *   delete:
     *     summary: Удалить отзыв
     *     tags: [Отзывы]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: feedbackId
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Отзыв успешно удален
     *       401:
     *         description: Не авторизован
     *       404:
     *         description: Отзыв не найден
     */
    registerRoute(app, 'delete', '/feedback/:feedbackId', FeedbackController, 'deleteFeedback');

    /**
     * @swagger
     * /default/feedback:
     *   delete:
     *     summary: Удалить все отзывы
     *     tags: [Отзывы]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Все отзывы успешно удалены
     *       401:
     *         description: Не авторизован
     */
    registerRoute(app, 'delete', '/default/feedback', FeedbackController, 'deleteFeedbackTable');
}; 