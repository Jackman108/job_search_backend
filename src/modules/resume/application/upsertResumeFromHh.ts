import type { MappedHhResume } from '@interface';
import { executeQuery } from '@utils';
import { getResumeByUserId } from '../infra/getResumeByUserId.js';
import { invalidateResumeIdCache } from '../infra/resumeIdCache.js';
import { createContactUser, getContactUser, updateContactUser } from './contactService.js';
import { createResumeUser, getResumeUser, updateResumeUser } from './resumeService.js';

async function replaceSkills(resumeId: string, skills: MappedHhResume['skills']): Promise<void> {
    await executeQuery(`DELETE FROM skills WHERE resume_id = $1`, [resumeId]);
    for (const s of skills) {
        await executeQuery(`INSERT INTO skills (resume_id, skill_name, proficiency_level) VALUES ($1, $2, $3)`, [
            resumeId,
            s.skill_name,
            s.proficiency_level || '',
        ]);
    }
}

async function replaceExperience(resumeId: string, rows: MappedHhResume['workExperience']): Promise<void> {
    await executeQuery(`DELETE FROM work_experience WHERE resume_id = $1`, [resumeId]);
    for (const e of rows) {
        await executeQuery(
            `
            INSERT INTO work_experience (resume_id, company_name, position, start_date, end_date, description)
            VALUES ($1, $2, $3, $4, $5, $6)
            `,
            [resumeId, e.company_name, e.position, e.start_date, e.end_date, e.description],
        );
    }
}

/** Create or overwrite local resume stack from mapped HH resume (first on account). */
export async function upsertResumeFromHh(userId: string, mapped: MappedHhResume): Promise<void> {
    const existing = await getResumeUser(userId);
    if (existing) {
        await updateResumeUser(userId, {
            full_name: mapped.resume.full_name,
            position: mapped.resume.position,
            employment_type: mapped.resume.employment_type,
            work_schedule: mapped.resume.work_schedule,
            travel_time: mapped.resume.travel_time,
            business_trip_readiness: mapped.resume.business_trip_readiness,
        });
    } else {
        await createResumeUser(userId, {
            full_name: mapped.resume.full_name,
            position: mapped.resume.position,
            employment_type: mapped.resume.employment_type,
            work_schedule: mapped.resume.work_schedule,
            travel_time: mapped.resume.travel_time,
            business_trip_readiness: mapped.resume.business_trip_readiness,
        });
        await invalidateResumeIdCache(userId);
    }

    const resumeId = await getResumeByUserId(userId);
    if (!resumeId) {
        throw new Error('Resume upsert failed: no resume id after create/update.');
    }

    const contact = await getContactUser(userId);
    if (contact) {
        await updateContactUser(userId, {
            resume_id: resumeId,
            phone: mapped.contacts.phone,
            email: mapped.contacts.email,
            personal_site: mapped.contacts.personal_site,
        });
    } else {
        await createContactUser(userId, {
            phone: mapped.contacts.phone,
            email: mapped.contacts.email,
            personal_site: mapped.contacts.personal_site,
        });
    }

    await replaceSkills(resumeId, mapped.skills);
    await replaceExperience(resumeId, mapped.workExperience);
}
