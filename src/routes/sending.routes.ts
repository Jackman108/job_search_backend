import { VacancyAuthController, VacancySubmitController, VacancyController } from '@controllers';
import express from 'express';
import { registerRoute } from '@middlewares';

export const initializeVacancyRoutes = (app: express.Application) => {
    /**
     * @swagger
     * /vacancy-auth:
     *   get:
     *     summary: Получить список авторизаций вакансий
     *     tags: [Авторизация вакансий]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Список авторизаций успешно получен
     *       401:
     *         description: Не авторизован
     */
    registerRoute(app, 'get', '/vacancy-auth', VacancyAuthController, 'getVacancyAuth');

    /**
     * @swagger
     * /vacancy-auth:
     *   post:
     *     summary: Создать новую авторизацию вакансии
     *     tags: [Авторизация вакансий]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               platform:
     *                 type: string
     *               credentials:
     *                 type: object
     *     responses:
     *       201:
     *         description: Авторизация успешно создана
     *       401:
     *         description: Не авторизован
     */
    registerRoute(app, 'post', '/vacancy-auth', VacancyAuthController, 'createVacancyAuth');

    /**
     * @swagger
     * /vacancy-auth/{authId}:
     *   put:
     *     summary: Обновить авторизацию вакансии
     *     tags: [Авторизация вакансий]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: authId
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
     *               platform:
     *                 type: string
     *               credentials:
     *                 type: object
     *     responses:
     *       200:
     *         description: Авторизация успешно обновлена
     *       401:
     *         description: Не авторизован
     *       404:
     *         description: Авторизация не найдена
     */
    registerRoute(app, 'put', '/vacancy-auth/:authId', VacancyAuthController, 'updateVacancyAuth');

    /**
     * @swagger
     * /vacancy-auth/{authId}:
     *   delete:
     *     summary: Удалить авторизацию вакансии
     *     tags: [Авторизация вакансий]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: authId
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Авторизация успешно удалена
     *       401:
     *         description: Не авторизован
     *       404:
     *         description: Авторизация не найдена
     */
    registerRoute(app, 'delete', '/vacancy-auth/:authId', VacancyAuthController, 'deleteVacancyAuth');

    /**
     * @swagger
     * /vacancy-field:
     *   get:
     *     summary: Получить список полей вакансий
     *     tags: [Поля вакансий]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Список полей успешно получен
     *       401:
     *         description: Не авторизован
     */
    registerRoute(app, 'get', '/vacancy-field', VacancySubmitController, 'getVacancySubmit');

    /**
     * @swagger
     * /vacancy-field:
     *   post:
     *     summary: Создать новое поле вакансии
     *     tags: [Поля вакансий]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               name:
     *                 type: string
     *               type:
     *                 type: string
     *               required:
     *                 type: boolean
     *     responses:
     *       201:
     *         description: Поле успешно создано
     *       401:
     *         description: Не авторизован
     */
    registerRoute(app, 'post', '/vacancy-field', VacancySubmitController, 'createVacancySubmit');

    /**
     * @swagger
     * /vacancy-field/{fieldId}:
     *   put:
     *     summary: Обновить поле вакансии
     *     tags: [Поля вакансий]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: fieldId
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
     *               name:
     *                 type: string
     *               type:
     *                 type: string
     *               required:
     *                 type: boolean
     *     responses:
     *       200:
     *         description: Поле успешно обновлено
     *       401:
     *         description: Не авторизован
     *       404:
     *         description: Поле не найдено
     */
    registerRoute(app, 'put', '/vacancy-field/:fieldId', VacancySubmitController, 'updateVacancySubmit');

    /**
     * @swagger
     * /vacancy-field/{fieldId}:
     *   delete:
     *     summary: Удалить поле вакансии
     *     tags: [Поля вакансий]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: fieldId
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Поле успешно удалено
     *       401:
     *         description: Не авторизован
     *       404:
     *         description: Поле не найдено
     */
    registerRoute(app, 'delete', '/vacancy-field/:fieldId', VacancySubmitController, 'deleteVacancySubmit');
}; 