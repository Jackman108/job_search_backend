// server/routes.ts
import express, {Response} from 'express';
import {ChatFeedbackController} from '../controllers/ChatFeedbackController.js';
import {ContactsController} from '../controllers/ContactsController.js';
import {ProfileController} from '../controllers/ProfileController.js';
import {ResumeController} from '../controllers/ResumeController.js';
import {ScriptController} from '../controllers/ScriptController.js';
import {SkillsController} from '../controllers/SkillsController.js';
import {VacancyController} from '../controllers/VacancyController.js';
import {WorkExperienceController} from '../controllers/WorkExperienceController.js';
import {AuthenticatedRequest, extractUserId} from './middlewares.js';

const profileController = new ProfileController();
const resumeController = new ResumeController();
const vacancyController = new VacancyController();
const chatFeedbackController = new ChatFeedbackController();
const contactsController = new ContactsController();
const skillsController = new SkillsController();
const workExperienceController = new WorkExperienceController();
const scriptController = new ScriptController();

export const initializeRoutes = (app: express.Application) => {

    app.post('/default/vacancies', extractUserId, (req: AuthenticatedRequest, res: Response) => vacancyController.createVacanciesTable(req, res));
    app.delete('/default/vacancies', extractUserId, (req: AuthenticatedRequest, res: Response) => vacancyController.deleteVacanciesTable(req, res));

    app.post('/default/feedback', extractUserId, (req: AuthenticatedRequest, res: Response) => chatFeedbackController.createFeedbackTable(req, res));
    app.delete('/default/feedback', extractUserId, (req: AuthenticatedRequest, res: Response) => chatFeedbackController.deleteFeedbackTable(req, res));

    app.get('/vacancy', extractUserId, (req: AuthenticatedRequest, res: Response) => vacancyController.getVacancies(req, res));
    app.delete('/vacancy/:vacancyId', extractUserId, (req: AuthenticatedRequest, res: Response) => vacancyController.deleteVacancy(req, res));

    app.get('/feedback', extractUserId, (req: AuthenticatedRequest, res: Response) => chatFeedbackController.getFeedback(req, res));
    app.delete('/feedback/:feedbackId', extractUserId, (req: AuthenticatedRequest, res: Response) => chatFeedbackController.deleteFeedback(req, res));

    app.get('/profile', extractUserId, (req: AuthenticatedRequest, res: Response) => profileController.getProfile(req, res));
    app.post('/profile', extractUserId, (req: AuthenticatedRequest, res: Response) => profileController.createProfile(req, res));
    app.put('/profile', extractUserId, (req: AuthenticatedRequest, res: Response) => profileController.updateProfile(req, res));
    app.delete('/profile', extractUserId, (req: AuthenticatedRequest, res: Response) => profileController.deleteProfile(req, res));

    app.get('/resume', extractUserId, (req: AuthenticatedRequest, res: Response) => resumeController.getResume(req, res));
    app.post('/resume', extractUserId, (req: AuthenticatedRequest, res: Response) => resumeController.createResume(req, res));
    app.put('/resume', extractUserId, (req: AuthenticatedRequest, res: Response) => resumeController.updateResume(req, res));
    app.delete('/resume', extractUserId, (req: AuthenticatedRequest, res: Response) => resumeController.deleteResume(req, res));

    app.get('/contacts', extractUserId, (req: AuthenticatedRequest, res: Response) => contactsController.getContacts(req, res));
    app.post('/contacts', extractUserId, (req: AuthenticatedRequest, res: Response) => contactsController.createContact(req, res));
    app.put('/contacts', extractUserId, (req: AuthenticatedRequest, res: Response) => contactsController.updateContact(req, res));
    app.delete('/contacts', extractUserId, (req: AuthenticatedRequest, res: Response) => contactsController.deleteContact(req, res));

    app.get('/skills', extractUserId, (req: AuthenticatedRequest, res: Response) => skillsController.getSkills(req, res));
    app.post('/skills', extractUserId, (req: AuthenticatedRequest, res: Response) => skillsController.createSkill(req, res));
    app.put('/skills/:skillId', extractUserId, (req: AuthenticatedRequest, res: Response) => skillsController.updateSkill(req, res));
    app.delete('/skills/:skillId', extractUserId, (req: AuthenticatedRequest, res: Response) => skillsController.deleteSkill(req, res));

    app.get('/work_experience', extractUserId, (req: AuthenticatedRequest, res: Response) => workExperienceController.getExperience(req, res));
    app.post('/work_experience', extractUserId, (req: AuthenticatedRequest, res: Response) => workExperienceController.createExperience(req, res));
    app.put('/work_experience/:experienceId', extractUserId, (req: AuthenticatedRequest, res: Response) => workExperienceController.updateExperience(req, res));
    app.delete('/work_experience/:experienceId', extractUserId, (req: AuthenticatedRequest, res: Response) => workExperienceController.deleteExperience(req, res));

    app.post('/start', extractUserId, (req: AuthenticatedRequest, res: Response) => scriptController.startScript(req, res));
    app.post('/stop', extractUserId, (req: AuthenticatedRequest, res: Response) => scriptController.stopScript(req, res));
    app.post('/refresh', extractUserId, (req: AuthenticatedRequest, res: Response) => scriptController.refreshData(req, res));
};
