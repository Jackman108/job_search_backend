export interface UserProfileUpdateFields {
    user_id: string;
    first_name: string;
    last_name: string;
    avatar?: string;
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
}

export interface AvatarUploadParams {
    avatar: string;
    updateFields: UserProfileUpdateFields;
} 