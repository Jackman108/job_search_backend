export const logError = (error: Error, query: string, values: any[]): void => {
    console.error("Database query error:", error.message);
    console.error("Failed query:", query);
    console.error("With values:", values);
};