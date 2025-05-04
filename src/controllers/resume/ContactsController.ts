// server/controllers/ContactsController.ts
import { Response } from 'express';
import { handleErrors } from '@middlewares';
import {
    createContactUser,
    deleteContactUser,
    getContactUser,
    updateContactUser
} from '@services';
import { AuthenticatedRequest } from '@interface';

export class ContactsController {
    async getContacts(req: AuthenticatedRequest, res: Response) {
        try {
            const contacts = await getContactUser(req.userId!);
            res.status(200).json(contacts);
        } catch (error) {
            handleErrors(res, error, 'Error retrieving contacts.');
        }
    }

    async createContact(req: AuthenticatedRequest, res: Response) {
        try {
            const newContact = await createContactUser(req.userId!, req.body);
            res.status(201).json(newContact);
        } catch (error) {
            handleErrors(res, error, 'Error creating contact.');
        }
    }

    async updateContact(req: AuthenticatedRequest, res: Response) {
        try {
            await updateContactUser(req.userId!, req.body);
            res.status(200).json(updateContactUser);
        } catch (error) {
            handleErrors(res, error, 'Error updating contact.');
        }
    }

    async deleteContact(req: AuthenticatedRequest, res: Response) {
        try {
            await deleteContactUser(req.userId!);
            res.status(200).json({ message: 'Contact deleted successfully.' });
        } catch (error) {
            handleErrors(res, error, 'Error deleting contact.');
        }
    }
}
