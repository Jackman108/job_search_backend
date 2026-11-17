/** Resume stack tables (resumes, contacts, skills, work_experience). */
export const resumeConfig = {
    tables: ['resumes', 'contacts', 'skills', 'work_experience'] as const,
};

export function validateResumeConfig(): void {
    // No required env today.
}
