export type AppNotification = {
    id: string;
    user_id: string;
    kind: string;
    title: string;
    body: string;
    created_at: string;
    read_at: string | null;
};
