import { Response } from 'express';
import { handleErrors } from '@middlewares';
import { AuthenticatedRequest } from '@interface';
import {
    createVacancySubmit,
    deleteVacancySubmit,
    getVacancySubmitByUserId,
    updateVacancySubmit
} from '@services';

export class VacancySubmitController {
    async getVacancySubmit(req: AuthenticatedRequest, res: Response) {
        try {
            const vacancySubmitData = await getVacancySubmitByUserId(req.userId!);
            res.status(200).json(vacancySubmitData);
        } catch (error) {
            handleErrors(res, error, 'Error retrieving vacancy submit data.');
        }
    }

    async createVacancySubmit(req: AuthenticatedRequest, res: Response) {
        try {
            const newVacancySubmitId = await createVacancySubmit(req.userId!, req.body);
            res.status(201).json({ id: newVacancySubmitId });
        } catch (error) {
            handleErrors(res, error, 'Error creating vacancy submit data.');
        }
    }

    async updateVacancySubmit(req: AuthenticatedRequest, res: Response) {
        try {
            await updateVacancySubmit(req.userId!, req.body);
            res.status(200).json({ message: 'Vacancy submit data updated successfully.' });
        } catch (error) {
            handleErrors(res, error, 'Error updating vacancy submit data.');
        }
    }

    async deleteVacancySubmit(req: AuthenticatedRequest, res: Response) {
        try {
            await deleteVacancySubmit(req.userId!, req.params.fieldId);
            res.status(200).json({ message: 'Vacancy submit data deleted successfully.' });
        } catch (error) {
            handleErrors(res, error, 'Error deleting vacancy submit data.');
        }
    }
}