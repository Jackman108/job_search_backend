import { ContactsController } from '@controllers';
import express from 'express';
import { registerRoute } from '@middlewares';

export const initializeContactsRoutes = (app: express.Application) => {
    /**
     * @swagger
     * /contacts:
     *   get:
     *     summary: Получить контакты пользователя
     *     tags: [Контакты]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Контакты успешно получены
     *       401:
     *         description: Не авторизован
     */
    registerRoute(app, 'get', '/contacts', ContactsController, 'getContacts');

    /**
     * @swagger
     * /contacts:
     *   post:
     *     summary: Создать контакт
     *     tags: [Контакты]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               type:
     *                 type: string
     *               value:
     *                 type: string
     *     responses:
     *       201:
     *         description: Контакт успешно создан
     *       401:
     *         description: Не авторизован
     */
    registerRoute(app, 'post', '/contacts', ContactsController, 'createContact');

    /**
     * @swagger
     * /contacts:
     *   put:
     *     summary: Обновить контакт
     *     tags: [Контакты]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               type:
     *                 type: string
     *               value:
     *                 type: string
     *     responses:
     *       200:
     *         description: Контакт успешно обновлен
     *       401:
     *         description: Не авторизован
     */
    registerRoute(app, 'put', '/contacts', ContactsController, 'updateContact');

    /**
     * @swagger
     * /contacts:
     *   delete:
     *     summary: Удалить контакт
     *     tags: [Контакты]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Контакт успешно удален
     *       401:
     *         description: Не авторизован
     */
    registerRoute(app, 'delete', '/contacts', ContactsController, 'deleteContact');
};
