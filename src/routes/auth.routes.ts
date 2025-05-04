import { VacancyAuthController, ProfileController } from '@controllers';
import express from 'express';
import { registerRoute } from '@middlewares';

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: API для аутентификации и профиля
 */

export const initializeAuthRoutes = (app: express.Application) => {
    /**
     * @swagger
     * /profile:
     *   get:
     *     summary: Получить профиль пользователя
     *     tags: [Auth]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Профиль пользователя успешно получен
     *       401:
     *         description: Не авторизован
     */
    registerRoute(app, 'get', '/profile', ProfileController, 'getProfile');

    /**
     * @swagger
     * /profile:
     *   put:
     *     summary: Обновить профиль пользователя
     *     tags: [Auth]
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
     *               email:
     *                 type: string
     *     responses:
     *       200:
     *         description: Профиль успешно обновлен
     *       401:
     *         description: Не авторизован
     */
    registerRoute(app, 'put', '/profile', ProfileController, 'updateProfile');

    /**
     * @swagger
     * /profile:
     *   delete:
     *     summary: Удалить профиль пользователя
     *     tags: [Auth]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Профиль успешно удален
     *       401:
     *         description: Не авторизован
     */
    registerRoute(app, 'delete', '/profile', ProfileController, 'deleteProfile');

}; 