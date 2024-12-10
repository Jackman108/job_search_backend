// server/routes.ts
import express from 'express';
import {ChatFeedbackController} from '../controllers/ChatFeedbackController.js';
import {ContactsController} from '../controllers/ContactsController.js';
import {ProfileController} from '../controllers/ProfileController.js';
import {ResumeController} from '../controllers/ResumeController.js';
import {ScriptController} from '../controllers/ScriptController.js';
import {SkillsController} from '../controllers/SkillsController.js';
import {VacancyController} from '../controllers/VacancyController.js';
import {WorkExperienceController} from '../controllers/WorkExperienceController.js';
import {registerRoute} from './middlewares.js';
import {PaymentController} from '../controllers/PaymentController.js';
import {SubscriptionController} from "../controllers/SubscriptionController.js";


export const initializeRoutes = (app: express.Application) => {
    registerRoute(app, 'post', '/default/vacancies', VacancyController, 'createVacanciesTable');
    registerRoute(app, 'delete', '/default/vacancies', VacancyController, 'deleteVacanciesTable');

    registerRoute(app, 'post', '/default/feedback', ChatFeedbackController, 'createFeedbackTable');
    registerRoute(app, 'delete', '/default/feedback', ChatFeedbackController, 'deleteFeedbackTable');

    registerRoute(app, 'post', '/default/payment', PaymentController, 'createPaymentTable');
    registerRoute(app, 'post', '/default/subscription', SubscriptionController, 'createSubscriptionTable');

    registerRoute(app, 'post', '/payments', PaymentController, 'listPayments');
    registerRoute(app, 'post', '/subscriptions', SubscriptionController, 'listSubscriptions');

    registerRoute(app, 'get', '/vacancy', VacancyController, 'getVacancies');
    registerRoute(app, 'delete', '/vacancy/:vacancyId', VacancyController, 'deleteVacancy');

    registerRoute(app, 'get', '/feedback',ChatFeedbackController, 'getFeedback');
    registerRoute(app, 'delete', '/feedback/:feedbackId', ChatFeedbackController, 'deleteFeedback');

    registerRoute(app, 'get', '/profile', ProfileController, 'getProfile');
    registerRoute(app, 'post', '/profile', ProfileController, 'createProfile');
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

    registerRoute(app, 'post', '/start', ScriptController, 'startScript');
    registerRoute(app, 'post', '/stop', ScriptController, 'stopScript');
    registerRoute(app, 'post', '/refresh', ScriptController, 'refreshData');

    registerRoute(app, 'get', '/payment/:id', PaymentController, 'getPayment');
    registerRoute(app, 'post', '/payment', PaymentController, 'createPayment');
    registerRoute(app, 'put', '/payment', PaymentController, 'updatePayment');
    registerRoute(app, 'delete', '/payment/:id', PaymentController, 'deletePayment');
    registerRoute(app, 'patch', '/payment/:id', PaymentController, 'updatePaymentStatus');

    registerRoute(app, 'get', '/subscription/:id', SubscriptionController, 'getSubscription');
    registerRoute(app, 'post', '/subscription', SubscriptionController, 'createSubscription');
    registerRoute(app, 'put', '/subscription', SubscriptionController, 'updateSubscription');
    registerRoute(app, 'delete', '/subscription/:id', SubscriptionController, 'deleteSubscription');


};
