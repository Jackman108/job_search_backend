/**
 * OpenAPI components for payment integration routes.
 * Consumed by swagger-jsdoc via apis in swagger.config.ts.
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     PaymentMethod:
 *       type: string
 *       enum: [webpay, crypto]
 *       description: Метод оплаты
 *
 *     PaymentStatus:
 *       type: string
 *       enum: [pending, processing, completed, failed, canceled, refunded]
 *       description: Статус платежа
 *
 *     PaymentInitRequest:
 *       type: object
 *       required:
 *         - payment_id
 *         - amount
 *       properties:
 *         payment_id:
 *           type: string
 *           format: uuid
 *           description: ID платежа (в формате UUID)
 *         amount:
 *           type: number
 *           description: Сумма платежа
 *         currency:
 *           type: string
 *           description: Валюта платежа
 *           default: BYN (для WebPay) или BTC (для криптоплатежей)
 *         network:
 *           type: string
 *           description: Сеть для криптоплатежа
 *           default: BTC
 *         success_url:
 *           type: string
 *           description: URL для редиректа при успешной оплате
 *         cancel_url:
 *           type: string
 *           description: URL для редиректа при отмене платежа
 *
 *     PaymentRefundRequest:
 *       type: object
 *       required:
 *         - paymentId
 *       properties:
 *         paymentId:
 *           type: string
 *           format: uuid
 *           description: ID платежа для возврата (в формате UUID)
 *         amount:
 *           type: number
 *           description: Сумма возврата (если не указана, будет полный возврат)
 *         reason:
 *           type: string
 *           description: Причина возврата
 *
 *     PaymentSuccessResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *         data:
 *           type: object
 *           description: Данные, специфичные для каждого метода платежа
 *
 *     PaymentErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           description: Сообщение об ошибке
 *
 *     WebPayInitResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *           properties:
 *             redirectUrl:
 *               type: string
 *               description: URL для перенаправления пользователя на страницу оплаты
 *             orderNum:
 *               type: string
 *               description: Номер заказа
 *             wt:
 *               type: string
 *               description: Токен WebPay
 *
 *     CryptoInitResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *           properties:
 *             payment_id:
 *               type: string
 *               format: uuid
 *               description: ID платежа (UUID)
 *             crypto_address:
 *               type: string
 *               description: Адрес для оплаты криптовалютой
 *             crypto_amount:
 *               type: number
 *               description: Сумма в криптовалюте
 *             payment_status:
 *               type: string
 *               description: Статус платежа
 *             expires_at:
 *               type: string
 *               format: date-time
 *               description: Срок действия платежа
 *
 *     PaymentStatusResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: string
 *           enum: [pending, processing, completed, failed, canceled, refunded]
 *           description: Статус платежа
 */
