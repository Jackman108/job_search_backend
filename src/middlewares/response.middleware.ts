import { Response } from 'express';

export const handleSuccess = (res: Response, message: string = 'Success', data?: any) => {
    res.status(200).json({ success: true, message, data });
};

export const handleErrors = (res: Response, error: unknown, defaultMessage: string) => {
    console.error(error);
    res.status(500).json({ success: false, message: defaultMessage });
}; 