import {Response} from 'express';
import {handleErrors} from '../../server/middlewares.js';
import {AuthenticatedRequest} from "../../interface/interface.js";
import {
    createVacancyAuth,
    deleteVacancyAuth,
    getVacancyAuthByUserId,
    updateVacancyAuth
} from '../../services/sending/vacancyAuthService.js';

export class VacancyAuthController {
    async getVacancyAuth(req: AuthenticatedRequest, res: Response) {
        try {
            const vacancyAuthData = await getVacancyAuthByUserId(req.userId!);
            res.status(200).json(vacancyAuthData);
        } catch (error) {
            handleErrors(res, error, 'Error retrieving vacancy auth data.');
        }
    }

    async createVacancyAuth(req: AuthenticatedRequest, res: Response) {
        try {
            const newVacancyAuthId = await createVacancyAuth(req.userId!, req.body);
            res.status(201).json({id: newVacancyAuthId});
        } catch (error) {
            handleErrors(res, error, 'Error creating vacancy auth data.');
        }
    }

    async updateVacancyAuth(req: AuthenticatedRequest, res: Response) {
        try {
            await updateVacancyAuth(req.userId!, req.body);
            res.status(200).json({ message: 'Vacancy auth data updated successfully.' });
        } catch (error) {
            handleErrors(res, error, 'Error updating vacancy auth data.');
        }
    }

    async deleteVacancyAuth(req: AuthenticatedRequest, res: Response) {
        try {
            await deleteVacancyAuth(req.userId!, req.params.authId);
            res.status(200).json({message: 'Vacancy auth data deleted successfully.'});
        } catch (error) {
            handleErrors(res, error, 'Error deleting vacancy auth data.');
        }
    }
}