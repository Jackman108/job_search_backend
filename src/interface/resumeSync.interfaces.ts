/** HH → local resume sync (POST /sync-resume + detached worker). */

export interface SyncResumeParams {
    userId: string;
    email: string;
    password: string;
}

export interface SyncResumeBody {
    email: string;
    password: string;
}

export type MappedHhResume = {
    resume: {
        full_name: string;
        position?: string;
        employment_type?: string;
        work_schedule?: string;
        travel_time?: string;
        business_trip_readiness: boolean;
    };
    contacts: {
        phone: string;
        email?: string;
        personal_site?: string;
    };
    skills: Array<{ skill_name: string; proficiency_level: string }>;
    workExperience: Array<{
        company_name: string;
        position: string;
        start_date: string | null;
        end_date: string | null;
        description: string;
    }>;
};
