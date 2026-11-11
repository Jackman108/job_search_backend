// server/controllers/VacancyController.ts
import { Response } from 'express';
import { handleErrors } from '@middlewares';
import { deleteVacancyTable, deleteVacancyUser, getVacanciesUser } from '@services';
import { AuthenticatedRequest } from '@interface';

export class VacancyController {
    async deleteVacanciesTable(req: AuthenticatedRequest, res: Response) {
        try {
            await deleteVacancyTable(req.userId!);
            res.status(200).json({ message: 'Vacancy table deleted successfully.' });
        } catch (error) {
            handleErrors(res, error, 'Error deleting vacancy table.');
        }
    }

    async getVacancies(req: AuthenticatedRequest, res: Response) {
        try {
            const vacancies = await getVacanciesUser(req.userId!);
            // Empty list is a valid resource state — REST 200 + [].
            res.status(200).json(vacancies);
        } catch (error) {
            handleErrors(res, error, 'Error retrieving vacancies.');
        }
    }

    async deleteVacancy(req: AuthenticatedRequest, res: Response) {
        try {
            await deleteVacancyUser(req.userId!, req.params.vacancyId);
            res.status(200).json({ message: 'Vacancy deleted successfully.' });
        } catch (error) {
            handleErrors(res, error, 'Error deleting vacancy.');
        }
    }
}
