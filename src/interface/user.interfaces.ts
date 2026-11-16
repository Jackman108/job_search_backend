export interface UserProfileUpdateFields {
    user_id: string;
    first_name: string;
    last_name: string;
    avatar?: string;
}

export interface ProfileRank {
    id: string;
    level: number;
    title: string;
    progressPct: number;
    nextTitle: string | null;
    nextSuccessfulResponses: number | null;
}

export interface ProfileData {
    id: number;
    user_id: string | number;
    first_name: string;
    last_name: string;
    avatar: string;
    balance: number;
    spin_count: number;
    successful_responses_count: number;
    current_status: string;
    /** Derived engagement rank (not a DB column). */
    rank?: ProfileRank;
}

export interface AvatarUploadParams {
    avatar: string;
    updateFields: UserProfileUpdateFields;
}
