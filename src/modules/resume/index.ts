import type express from 'express';
import { validateResumeConfig } from './module.config.js';
import { registerContactsRoutes } from './http/contacts.routes.js';
import { registerResumeRoutes } from './http/resume.routes.js';
import { registerSkillsRoutes } from './http/skills.routes.js';
import { registerWorkExperienceRoutes } from './http/workExperience.routes.js';

export { ContactsController } from './http/ContactsController.js';
export { ResumeController } from './http/ResumeController.js';
export { SkillsController } from './http/SkillsController.js';
export { WorkExperienceController } from './http/WorkExperienceController.js';

export {
    createContactUser,
    deleteContactUser,
    getContactUser,
    updateContactUser,
} from './application/contactService.js';
export { createResumeUser, deleteResumeUser, getResumeUser, updateResumeUser } from './application/resumeService.js';
export { createSkillUser, deleteSkillUser, getSkillsUser, updateSkillUser } from './application/skillService.js';
export {
    createExperienceUser,
    deleteExperienceUser,
    getExperienceUser,
    updateExperienceUser,
} from './application/workExperienceService.js';
export { upsertResumeFromHh } from './application/upsertResumeFromHh.js';
export { getResumeByUserId } from './infra/getResumeByUserId.js';
export { getResumeIdCacheByUserId, invalidateResumeIdCache } from './infra/resumeIdCache.js';
export { resumeConfig } from './module.config.js';

export function register(app: express.Application): void {
    validateResumeConfig();
    registerResumeRoutes(app);
    registerContactsRoutes(app);
    registerSkillsRoutes(app);
    registerWorkExperienceRoutes(app);
}
