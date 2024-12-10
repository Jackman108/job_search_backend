import {executeQuery, generateUpdateQuery} from "../../utils/queryHelpers.js";


export const createContactUser = async (
    userId: string,
    contactData: {
        phone: string;
        email?: string;
        personal_site?: string
    }
): Promise<string> => {
    const query = `
        INSERT INTO contacts (user_id, phone, email, personal_site, created_at, updated_at)
        VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING id;
    `;

    const values = [
        userId,
        contactData.phone,
        contactData.email,
        contactData.personal_site,
    ];

    const result = await executeQuery(query, values);
    return result[0].id;
};


export const getContactUser = async (userId: string): Promise<any> => {
    const query = `SELECT * FROM contacts WHERE user_id = $1`;
    const result = await executeQuery(query, [userId]);
    return result[0] || null;
};


export const updateContactUser = async (
    userId: string,
    updates: { phone?: string; email?: string; personal_site?: string }
): Promise<void> => {
    const {query, values} = generateUpdateQuery("contacts", updates, "user_id", userId);
    await executeQuery(query, values);
};


export const deleteContactUser = async (userId: string): Promise<void> => {
    const query = `DELETE FROM contacts WHERE user_id = $1;`;
    await executeQuery(query, [userId]);
};
