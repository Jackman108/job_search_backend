// server/controllers/VacancyController.ts
import {Response} from 'express';
import {handleErrors} from '../server/middlewares.js';
import {deleteVacancyTable, deleteVacancyUser, getVacanciesUser} from '../services/vacancyService.js';
import {AuthenticatedRequest} from "../interface/interface.js";

export class VacancyController {

    async deleteVacanciesTable(req: AuthenticatedRequest, res: Response) {
        try {
            await deleteVacancyTable(req.userId!);
            res.status(200).json({message: 'Vacancy table deleted successfully.'});
        } catch (error) {
            handleErrors(res, error, 'Error deleting vacancy table.');
        }
    }

    async getVacancies(req: AuthenticatedRequest, res: Response) {
        try {
            const vacancies = await getVacanciesUser(req.userId!);
            res.status(vacancies.length ? 200 : 404).json(vacancies.length ? vacancies : {message: 'No vacancies found.'});
        } catch (error) {
            handleErrors(res, error, 'Error retrieving vacancies.');
        }
    }

    async deleteVacancy(req: AuthenticatedRequest, res: Response) {
        try {
            await deleteVacancyUser(req.userId!, req.params.vacancyId);
            res.status(200).json({message: 'Vacancy deleted successfully.'});
        } catch (error) {
            handleErrors(res, error, 'Error deleting vacancy.');
        }
    }
}
