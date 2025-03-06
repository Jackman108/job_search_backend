// server/routes.ts
import express from 'express';
import {FeedbackController} from '../controllers/FeedbackController.js';
import {ContactsController} from '../controllers/resume/ContactsController.js';
import {ProfileController} from '../controllers/ProfileController.js';
import {ResumeController} from '../controllers/resume/ResumeController.js';
import {ScriptController} from '../controllers/ScriptController.js';
import {SkillsController} from '../controllers/resume/SkillsController.js';
import {VacancyController} from '../controllers/VacancyController.js';
import {WorkExperienceController} from '../controllers/resume/WorkExperienceController.js';
import {registerRoute} from './middlewares.js';
import {PaymentController} from '../controllers/PaymentController.js';
import {SubscriptionController} from "../controllers/SubscriptionController.js";
import {VacancyAuthController} from "../controllers/sending/VacancyAuthController.js";
import {VacancySubmitController} from "../controllers/sending/VacancySubmitController.js";


export const initializeRoutes = (app: express.Application) => {


    registerRoute(app, 'get', '/vacancy', VacancyController, 'getVacancies');
    registerRoute(app, 'delete', '/vacancy/:vacancyId', VacancyController, 'deleteVacancy');

    registerRoute(app, 'get', '/feedback', FeedbackController, 'getFeedback');
    registerRoute(app, 'delete', '/feedback/:feedbackId', FeedbackController, 'deleteFeedback');

    registerRoute(app, 'get', '/profile', ProfileController, 'getProfile');
    registerRoute(app, 'put', '/profile', ProfileController, 'updateProfile');
    registerRoute(app, 'delete', '/profile', ProfileController, 'deleteProfile');

    registerRoute(app, 'get', '/resume', ResumeController, 'getResume');
    registerRoute(app, 'post', '/resume', ResumeController, 'createResume');
    registerRoute(app, 'put', '/resume', ResumeController, 'updateResume');
    registerRoute(app, 'delete', '/resume', ResumeController, 'deleteResume');

    registerRoute(app, 'get', '/contacts', ContactsController, 'getContacts');
    registerRoute(app, 'post', '/contacts', ContactsController, 'createContact');
    registerRoute(app, 'put', '/contacts', ContactsController, 'updateContact');
    registerRoute(app, 'delete', '/contacts', ContactsController, 'deleteContact');

    registerRoute(app, 'get', '/skills', SkillsController, 'getSkills');
    registerRoute(app, 'post', '/skills', SkillsController, 'createSkill');
    registerRoute(app, 'put', '/skills/:skillId', SkillsController, 'updateSkill');
    registerRoute(app, 'delete', '/skills/:skillId', SkillsController, 'deleteSkill');

    registerRoute(app, 'get', '/work_experience', WorkExperienceController, 'getExperience');
    registerRoute(app, 'post', '/work_experience', WorkExperienceController, 'createExperience');
    registerRoute(app, 'put', '/work_experience/:experienceId', WorkExperienceController, 'updateExperience');
    registerRoute(app, 'delete', '/work_experience/:experienceId', WorkExperienceController, 'deleteExperience');

    registerRoute(app, 'get', '/vacancy-auth', VacancyAuthController, 'getVacancyAuth');
    registerRoute(app, 'post', '/vacancy-auth', VacancyAuthController, 'createVacancyAuth');
    registerRoute(app, 'put', '/vacancy-auth/:authId', VacancyAuthController, 'updateVacancyAuth');
    registerRoute(app, 'delete', '/vacancy-auth/:authId', VacancyAuthController, 'deleteVacancyAuth');

    registerRoute(app, 'get', '/vacancy-field', VacancySubmitController, 'getVacancySubmit');
    registerRoute(app, 'post', '/vacancy-field', VacancySubmitController, 'createVacancySubmit');
    registerRoute(app, 'put', '/vacancy-field/:fieldId', VacancySubmitController, 'updateVacancySubmit');
    registerRoute(app, 'delete', '/vacancy-field/:fieldId', VacancySubmitController, 'deleteVacancySubmit');

    registerRoute(app, 'post', '/start', ScriptController, 'startScript');
    registerRoute(app, 'post', '/stop', ScriptController, 'stopScript');
    registerRoute(app, 'post', '/refresh', ScriptController, 'refreshData');


    registerRoute(app, 'delete', '/default/vacancies', VacancyController, 'deleteVacanciesTable');
    registerRoute(app, 'delete', '/default/feedback', FeedbackController, 'deleteFeedbackTable');

    registerRoute(app, 'get', '/payment', PaymentController, 'listPayments');
    registerRoute(app, 'get', '/payment/:id', PaymentController, 'getPayment');
    registerRoute(app, 'post', '/payment', PaymentController, 'createPayment');
    registerRoute(app, 'put', '/payment/:id', PaymentController, 'updatePayment');
    registerRoute(app, 'delete', '/payment/:id', PaymentController, 'deletePayment');
    registerRoute(app, 'patch', '/payment/:id', PaymentController, 'updatePaymentStatus');

    registerRoute(app, 'get', '/subscription', SubscriptionController, 'listSubscriptions');
    registerRoute(app, 'get', '/subscription/:id', SubscriptionController, 'getSubscription');
    registerRoute(app, 'post', '/subscription', SubscriptionController, 'createSubscription');
    registerRoute(app, 'put', '/subscription/:id', SubscriptionController, 'updateSubscription');
    registerRoute(app, 'delete', '/subscription/:id', SubscriptionController, 'deleteSubscription');


};
