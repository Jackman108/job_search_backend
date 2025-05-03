export interface Skill {
    id: string;
    resume_id: string;
    skill_name: string;
    proficiency_level: string;
}

export interface CreateSkillInput {
    skill_name: string;
    proficiency_level: string;
}

export interface UpdateSkillInput {
    skill_name?: string;
    proficiency_level?: string;
}