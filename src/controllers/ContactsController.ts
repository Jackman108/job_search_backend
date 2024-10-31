// server/controllers/ContactsController.ts
import { Response } from 'express';
import { AuthenticatedRequest, handleErrors } from '../server/middlewares.js';
import { createContactUser, deleteContactUser, getContactUser, updateContactUser } from '../services/resume/contactService.js';

export class ContactsController {
    async getContacts(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.userId;
            if (!userId) {
                return res.status(400).json({ message: 'userId is required.' });
            }

            const contacts = await getContactUser(userId);
            res.status(contacts ? 200 : 404).json(contacts || { message: 'Контакты не найдены.' });
        } catch (error) {
            handleErrors(res, error, 'Error retrieving contacts.');
        }
    }
    async createContact(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.userId;
            const contactData = req.body;
            if (!userId) {
                return res.status(400).json({ message: 'userId is required.' });
            }

            const newContact = await createContactUser(userId, contactData);
            res.status(201).json(newContact);
        } catch (error) {
            handleErrors(res, error, 'Error creating contact.');
        }
        
    }
    async updateContact(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.userId;
            const contactData = req.body;
            if (!userId) {
                return res.status(400).json({ message: 'userId is required.' });
            }

            const newContact = await updateContactUser(userId, contactData);
            res.status(201).json(newContact);
        } catch (error) {
            handleErrors(res, error, 'Error creating contact.');
        }
    }
    
    async deleteContact(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.userId;
            const { contactId } = req.params;
            if (!userId) {
                return res.status(400).json({ message: 'userId is required.' });
            }

            await deleteContactUser(userId);
            res.status(200).json({ message: 'Contact deleted successfully.' });
        } catch (error) {
            handleErrors(res, error, 'Error deleting contact.');
        }
    }
}
