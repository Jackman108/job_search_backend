import { WorkExperienceController } from '@controllers';
import express from 'express';
import { registerRoute } from '@middlewares';

export const initializeWorkExperienceRoutes = (app: express.Application) => {
    /**
     * @swagger
     * /work_experience:
     *   get:
     *     summary: Получить опыт работы
     *     tags: [Опыт работы]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Опыт работы успешно получен
     *       401:
     *         description: Не авторизован
     */
    registerRoute(app, 'get', '/work_experience', WorkExperienceController, 'getExperience');

    /**
     * @swagger
     * /work_experience:
     *   post:
     *     summary: Создать запись об опыте работы
     *     tags: [Опыт работы]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               company:
     *                 type: string
     *               position:
     *                 type: string
     *               startDate:
     *                 type: string
     *               endDate:
     *                 type: string
     *               description:
     *                 type: string
     *     responses:
     *       201:
     *         description: Запись об опыте работы успешно создана
     *       401:
     *         description: Не авторизован
     */
    registerRoute(app, 'post', '/work_experience', WorkExperienceController, 'createExperience');

    /**
     * @swagger
     * /work_experience/{experienceId}:
     *   put:
     *     summary: Обновить запись об опыте работы
     *     tags: [Опыт работы]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: experienceId
     *         required: true
     *         schema:
     *           type: string
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               company:
     *                 type: string
     *               position:
     *                 type: string
     *               startDate:
     *                 type: string
     *               endDate:
     *                 type: string
     *               description:
     *                 type: string
     *     responses:
     *       200:
     *         description: Запись об опыте работы успешно обновлена
     *       401:
     *         description: Не авторизован
     *       404:
     *         description: Запись не найдена
     */
    registerRoute(app, 'put', '/work_experience/:experienceId', WorkExperienceController, 'updateExperience');

    /**
     * @swagger
     * /work_experience/{experienceId}:
     *   delete:
     *     summary: Удалить запись об опыте работы
     *     tags: [Опыт работы]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: experienceId
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Запись об опыте работы успешно удалена
     *       401:
     *         description: Не авторизован
     *       404:
     *         description: Запись не найдена
     */
    registerRoute(app, 'delete', '/work_experience/:experienceId', WorkExperienceController, 'deleteExperience');
};
