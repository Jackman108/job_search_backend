import client from "../config/dbConfig.js";

export const createContact = async (
    userId: string,
    contactData: {
        phone: string;
        email?: string;
        personal_site?: string
    }
): Promise<string> => {
    const insertContactQuery = `
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

    try {
        const result = await client.query(insertContactQuery, values);
        const contactId = result.rows[0].id;
        console.log(`Contact created with ID ${contactId}`);
        return contactId;
    } catch (err) {
        console.error('Error creating contact:', err);
        throw err;
    }
};

export const getContactById = async (userId: string): Promise<any> => {
    const query = `SELECT * FROM contacts WHERE user_id = $1`;
    try {
        const result = await client.query(query, [userId]);
        return result.rows[0] || null;
    } catch (err) {
        console.error(`Error retrieving contact ${userId}:`, err);
        throw err;
    }
};

export const updateContact = async (
    userId: string,
    updates: { phone?: string; email?: string; personal_site?: string }
): Promise<void> => {
    const setClause: string[] = [];
    const values: any[] = [];

    if (updates.phone) {
        setClause.push(`phone = $${values.length + 1}`);
        values.push(updates.phone);
    }
    if (updates.email) {
        setClause.push(`email = $${values.length + 1}`);
        values.push(updates.email);
    }
    if (updates.personal_site) {
        setClause.push(`personal_site = $${values.length + 1}`);
        values.push(updates.personal_site);
    }

    if (values.length === 0) {
        throw new Error('No update fields provided');
    }

    const setClauseStr = setClause.join(', ');
    const updateQuery = `
        UPDATE contacts
        SET ${setClauseStr}, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $${values.length + 1};
    `;
    values.push(userId);

    try {
        await client.query(updateQuery, values);
        console.log(`Contact with user ID ${userId} updated successfully.`);
    } catch (err) {
        console.error(`Error updating contact ${userId}:`, err);
        throw err;
    }
};

export const deleteContact = async (userId: string): Promise<void> => {
    const deleteQuery = `DELETE FROM contacts WHERE user_id = $1;`;
    try {
        await client.query(deleteQuery, [userId]);
        console.log(`Contact with user ID ${userId} deleted successfully.`);
    } catch (err) {
        console.error(`Error deleting contact ${userId}:`, err);
        throw err;
    }
};
