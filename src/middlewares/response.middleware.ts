import { logger } from '@utils';
import { Response } from 'express';

export const handleSuccess = (res: Response, message: string = 'Success', data?: any) => {
    res.status(200).json({ success: true, message, data });
};

export const handleErrors = (res: Response, error: unknown, defaultMessage: string) => {
    const status =
        typeof error === 'object' &&
        error !== null &&
        'status' in error &&
        typeof (error as { status?: unknown }).status === 'number'
            ? (error as { status: number }).status
            : 500;
    const detail = error instanceof Error ? error.message : String(error);
    logger.error(defaultMessage, { error: detail, status });
    res.status(status).json({
        success: false,
        message: status >= 500 ? defaultMessage : detail || defaultMessage,
    });
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
        error: error instanceof Error ? error.message : message,
    });
};
