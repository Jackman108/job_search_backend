import { ResumeController } from '@controllers';
import express from 'express';
import { registerRoute } from '@middlewares';

export const initializeResumeRoutes = (app: express.Application) => {
    /**
     * @swagger
     * /resume:
     *   get:
     *     summary: Получить резюме пользователя
     *     tags: [Резюме]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Резюме успешно получено
     *       401:
     *         description: Не авторизован
     */
    registerRoute(app, 'get', '/resume', ResumeController, 'getResume');

    /**
     * @swagger
     * /resume:
     *   post:
     *     summary: Создать резюме
     *     tags: [Резюме]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               title:
     *                 type: string
     *               description:
     *                 type: string
     *     responses:
     *       201:
     *         description: Резюме успешно создано
     *       401:
     *         description: Не авторизован
     */
    registerRoute(app, 'post', '/resume', ResumeController, 'createResume');

    /**
     * @swagger
     * /resume:
     *   put:
     *     summary: Обновить резюме
     *     tags: [Резюме]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               title:
     *                 type: string
     *               description:
     *                 type: string
     *     responses:
     *       200:
     *         description: Резюме успешно обновлено
     *       401:
     *         description: Не авторизован
     */
    registerRoute(app, 'put', '/resume', ResumeController, 'updateResume');

    /**
     * @swagger
     * /resume:
     *   delete:
     *     summary: Удалить резюме
     *     tags: [Резюме]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Резюме успешно удалено
     *       401:
     *         description: Не авторизован
     */
    registerRoute(app, 'delete', '/resume', ResumeController, 'deleteResume');
};
