/**
 * Narrow port so chat scenarios stay free of API `@services` feedback persistence.
 * Wired by the API composition root (`createProcessJobDeps`).
 */
export interface FeedbackSaveRecord {
    id: number;
    vacancy_id: number;
    feedback_text: string;
    feedback_date: Date;
    response_status: string;
}

export interface FeedbackRepo {
    saveChatFeedback(data: FeedbackSaveRecord, userId: string): Promise<void>;
    /** Rows used for chat dedupe — at least `id`. */
    getChatFeedback(userId: string): Promise<Array<{ id: number }>>;
}
