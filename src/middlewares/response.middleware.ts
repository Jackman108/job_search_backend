import { logger } from '@utils';
import { Response } from 'express';

export const handleSuccess = (res: Response, message: string = 'Success', data?: any) => {
    res.status(200).json({ success: true, message, data });
};

export const handleErrors = (res: Response, error: unknown, defaultMessage: string) => {
    console.error(error);
    res.status(500).json({ success: false, message: defaultMessage });
};


/**
 * Общая функция для обработки ошибок в контроллере
 * @param res Объект Response Express
 * @param error Ошибка для обработки
 * @param message Сообщение для пользователя
 */
export const handleControllerError = (res: Response, error: unknown, message: string): void => {
    logger.error(`Payment integration controller error: ${message}`, { error });
    res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : message
    });
};
