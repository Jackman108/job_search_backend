import { SkillsController } from '@controllers';
import express from 'express';
import { registerRoute } from '@middlewares';

export const initializeSkillsRoutes = (app: express.Application) => {
    /**
     * @swagger
     * /skills:
     *   get:
     *     summary: Получить список навыков
     *     tags: [Навыки]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Список навыков успешно получен
     *       401:
     *         description: Не авторизован
     */
    registerRoute(app, 'get', '/skills', SkillsController, 'getSkills');

    /**
     * @swagger
     * /skills:
     *   post:
     *     summary: Создать навык
     *     tags: [Навыки]
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
     *               level:
     *                 type: string
     *     responses:
     *       201:
     *         description: Навык успешно создан
     *       401:
     *         description: Не авторизован
     */
    registerRoute(app, 'post', '/skills', SkillsController, 'createSkill');

    /**
     * @swagger
     * /skills/{skillId}:
     *   put:
     *     summary: Обновить навык
     *     tags: [Навыки]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: skillId
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
     *               level:
     *                 type: string
     *     responses:
     *       200:
     *         description: Навык успешно обновлен
     *       401:
     *         description: Не авторизован
     *       404:
     *         description: Навык не найден
     */
    registerRoute(app, 'put', '/skills/:skillId', SkillsController, 'updateSkill');

    /**
     * @swagger
     * /skills/{skillId}:
     *   delete:
     *     summary: Удалить навык
     *     tags: [Навыки]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: skillId
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Навык успешно удален
     *       401:
     *         description: Не авторизован
     *       404:
     *         description: Навык не найден
     */
    registerRoute(app, 'delete', '/skills/:skillId', SkillsController, 'deleteSkill');
};
