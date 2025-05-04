import {
    ResumeController,
    ContactsController,
    SkillsController,
    WorkExperienceController,
} from '@controllers';
import express from 'express';
import { registerRoute } from '@middlewares';

export const initializeUserRoutes = (app: express.Application) => {
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