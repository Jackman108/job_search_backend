// server/controllers/VacancyController.ts
import {Response} from 'express';
import {AuthenticatedRequest, handleErrors} from '../server/middlewares.js';
import {
    createTableVacanciesUser,
    deleteVacancyTable,
    deleteVacancyUser,
    getVacanciesUser
} from '../services/vacancyService.js';

export class VacancyController {
    async createVacanciesTable(req: AuthenticatedRequest, res: Response,) {
        const userId = req.userId;
        if (!userId) {
            return res.status(400).json({message: 'userId is required.'});
        }
        
        try {
            await createTableVacanciesUser(userId);
            res.status(201).json({message: 'Vacancy Table successfully created.'});
        } catch (error) {
            handleErrors(res, error, 'Error creating a Vacancy Table.');
        }
    }

    async deleteVacanciesTable(req: AuthenticatedRequest, res: Response) {
        const userId = req.userId;
        if (!userId) {
            return res.status(400).json({message: 'userId is required.'});
        }

        try {
            await deleteVacancyTable(userId);
            res.status(200).json({message: 'Vacancy table deleted successfully.'});
        } catch (error) {
            handleErrors(res, error, 'Error deleting vacancy table.');
        }
    }

    async getVacancies(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.userId;
            if (!userId) {
                return res.status(400).json({message: 'userId is required.'});
            }

            const vacancies = await getVacanciesUser(userId);
            res.status(vacancies.length ? 200 : 404).json(vacancies.length ? vacancies : {message: 'No vacancies found.'});
        } catch (error) {
            handleErrors(res, error, 'Error retrieving vacancies.');
        }
    }

    async deleteVacancy(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.userId;
            const {vacancyId} = req.params;
            if (!userId) {
                return res.status(400).json({message: 'userId is required.'});
            }
            await deleteVacancyUser(vacancyId, userId);
            res.status(200).json({message: 'Vacancy deleted successfully.'});
        } catch (error) {
            handleErrors(res, error, 'Error deleting vacancy.');
        }
    }
}
