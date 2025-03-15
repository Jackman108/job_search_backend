import {executeQuery, generateUpdateQuery} from "../../utils/queryHelpers.js";
import {getResumeByUserId} from "../../utils/getResumeByUserId.js";


export const createContactUser = async (
    userId: string,
    contactData: {
        phone: string;
        email?: string;
        personal_site?: string
    }
): Promise<string> => {
    const resumeId = await getResumeByUserId(userId);
    if (!resumeId) {
        throw new Error("Контакт не создан. Возможно, у пользователя нет резюме.");
    }
    const query = `
        INSERT INTO contacts (resume_id, phone, email, personal_site)
        VALUES ($1, $2, $3, $4) RETURNING id;`;

    const values = [
        resumeId,
        contactData.phone,
        contactData.email,
        contactData.personal_site,
    ];

    const result = await executeQuery(query, values);
    return result[0].id;
};


export const getContactUser = async (userId: string): Promise<any> => {
    const resumeId = await getResumeByUserId(userId);
    if (!resumeId) return null;

    const query = `SELECT * FROM contacts WHERE resume_id = $1 LIMIT 1`;
    const result = await executeQuery(query, [resumeId]);

    return result[0] || null;
};


export const updateContactUser = async (userId: string,
    updates: { resume_id: string, phone: string; email?: string; personal_site?: string }
): Promise<void> => {
    const {query, values} = generateUpdateQuery(
        "contacts",
        updates,
        "resume_id",
        updates.resume_id
    );

    await executeQuery(query, values);
};


export const deleteContactUser = async (userId: string): Promise<void> => {
    const resumeId = await getResumeByUserId(userId);
    const query = `DELETE FROM contacts WHERE resume_id = $1;`;

    await executeQuery(query, [resumeId]);
};
