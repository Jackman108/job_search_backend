import { Request, Response } from 'express';
import { handleSuccess, handleErrors } from '@middlewares';

export class WebpayController {
    /**
     * Обработка возврата покупателя после успешной оплаты (wsb_return_url)
     */
    async handleReturn(req: Request, res: Response) {
        const { wsb_order_num, wsb_tid } = req.query;
        if (!wsb_order_num || !wsb_tid) {
            return res.status(400).json({ error: 'Missing wsb_order_num or wsb_tid' });
        }
        // Здесь можно обновить статус платежа в БД: Completed
        handleSuccess(res, 'Return received', { orderNum: wsb_order_num, transactionId: wsb_tid });
    }

    /**
     * Обработка возврата покупателя при отмене оплаты (wsb_cancel_return_url)
     */
    async handleCancel(req: Request, res: Response) {
        const { wsb_order_num } = req.query;
        if (!wsb_order_num) {
            return res.status(400).json({ error: 'Missing wsb_order_num' });
        }
        // Здесь можно обновить статус платежа в БД: Failed
        handleSuccess(res, 'Cancel received', { orderNum: wsb_order_num });
    }

    /**
     * Обработка нотификатора WebPay (wsb_notify_url)
     */
    async handleNotify(req: Request, res: Response) {
        const payload = req.body;
        // Подтверждение успешного приёма нотификатора
        // Тут можно проверить подпись, обновить статус платежа и т.д.
        console.log('WebPay notify payload:', payload);
        // Ответ должен быть 200 OK
        res.sendStatus(200);
    }
} 