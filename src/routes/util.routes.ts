import { ScriptController } from '@controllers';
import express from 'express';
import { registerRoute } from '@middlewares';

export const initializeUtilRoutes = (app: express.Application) => {
    /**
     * @swagger
     * /start:
     *   post:
     *     summary: Запустить скрипт
     *     tags: [Утилиты]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Скрипт успешно запущен
     *       401:
     *         description: Не авторизован
     */
    registerRoute(app, 'post', '/start', ScriptController, 'startScript');

    /**
     * @swagger
     * /stop:
     *   post:
     *     summary: Остановить скрипт
     *     tags: [Утилиты]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Скрипт успешно остановлен
     *       401:
     *         description: Не авторизован
     */
    registerRoute(app, 'post', '/stop', ScriptController, 'stopScript');

    /**
     * @swagger
     * /refresh:
     *   post:
     *     summary: Обновить данные
     *     tags: [Утилиты]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Данные успешно обновлены
     *       401:
     *         description: Не авторизован
     */
    registerRoute(app, 'post', '/refresh', ScriptController, 'refreshData');

    /**
     * @swagger
     * /jobs/{jobId}:
     *   get:
     *     summary: Статус HH worker job
     *     tags: [Утилиты]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: jobId
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Статус задачи
     *       404:
     *         description: Не найдено
     */
    registerRoute(app, 'get', '/jobs/:jobId', ScriptController, 'getJobStatus');
}; 