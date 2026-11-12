/**
 * OpenAPI paths for payment integration routes.
 */

/**
 * @swagger
 * /api/payments/integration/{paymentMethod}:
 *   post:
 *     summary: Инициализация платежа с использованием выбранной платежной системы
 *     description: |
 *       Создает новый платеж с использованием выбранной платежной системы (WebPay или Crypto).
 *       Для каждой системы требуются разные параметры, но основные (payment_id и amount) обязательны для всех.
 *     tags: [Интеграция оплаты]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentMethod
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/PaymentMethod'
 *         description: Метод оплаты (webpay, crypto)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PaymentInitRequest'
 *           examples:
 *             webpay:
 *               value:
 *                 payment_id: "123e4567-e89b-12d3-a456-426614174000"
 *                 amount: 100
 *                 currency: "BYN"
 *                 success_url: "https://example.com/success"
 *                 cancel_url: "https://example.com/cancel"
 *             crypto:
 *               value:
 *                 payment_id: "123e4567-e89b-12d3-a456-426614174000"
 *                 amount: 0.01
 *                 currency: "BTC"
 *                 network: "BTC"
 *     responses:
 *       200:
 *         description: Платеж успешно инициализирован
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/WebPayInitResponse'
 *                 - $ref: '#/components/schemas/CryptoInitResponse'
 *       400:
 *         description: Ошибка при инициализации платежа
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentErrorResponse'
 *       401:
 *         description: Неавторизованный доступ
 *       500:
 *         description: Внутренняя ошибка сервера
 */

/**
 * @swagger
 * /api/payments/webhook/{paymentMethod}:
 *   post:
 *     summary: Обработка вебхука от платежной системы
 *     description: |
 *       Обрабатывает входящие вебхуки от платежных систем.
 *       Для проверки подлинности вебхука используется подпись, переданная в заголовке 'x-webhook-signature'.
 *     tags: [Интеграция оплаты]
 *     parameters:
 *       - in: path
 *         name: paymentMethod
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/PaymentMethod'
 *         description: Метод оплаты (webpay, crypto)
 *       - in: header
 *         name: x-webhook-signature
 *         schema:
 *           type: string
 *         description: Подпись вебхука для проверки подлинности
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Данные вебхука, специфичные для каждой платежной системы
 *     responses:
 *       200:
 *         description: Вебхук успешно обработан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentSuccessResponse'
 *       400:
 *         description: Ошибка при обработке вебхука
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentErrorResponse'
 *       500:
 *         description: Внутренняя ошибка сервера
 */

/**
 * @swagger
 * /api/payments/status/{paymentMethod}/{paymentId}:
 *   get:
 *     summary: Проверка статуса платежа
 *     description: |
 *       Проверяет текущий статус платежа в выбранной платежной системе.
 *       Возвращает один из статусов: pending, processing, completed, failed, canceled, refunded.
 *     tags: [Интеграция оплаты]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentMethod
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/PaymentMethod'
 *         description: Метод оплаты (webpay, crypto)
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID платежа (UUID)
 *     responses:
 *       200:
 *         description: Статус платежа успешно получен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentStatusResponse'
 *             examples:
 *               success:
 *                 value:
 *                   success: true
 *                   message: "Payment status retrieved successfully"
 *                   data: "completed"
 *       400:
 *         description: Ошибка при получении статуса платежа
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentErrorResponse'
 *       401:
 *         description: Неавторизованный доступ
 *       500:
 *         description: Внутренняя ошибка сервера
 */

/**
 * @swagger
 * /api/payments/refund/{paymentMethod}:
 *   post:
 *     summary: Возврат средств по платежу
 *     description: |
 *       Инициирует возврат средств для указанного платежа.
 *       Если сумма возврата не указана, будет выполнен полный возврат.
 *     tags: [Интеграция оплаты]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentMethod
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/PaymentMethod'
 *         description: Метод оплаты (webpay, crypto)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PaymentRefundRequest'
 *           example:
 *             paymentId: "123e4567-e89b-12d3-a456-426614174000"
 *             amount: 50
 *             reason: "Частичный возврат по запросу клиента"
 *     responses:
 *       200:
 *         description: Возврат успешно инициирован
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentSuccessResponse'
 *             example:
 *               success: true
 *               message: "Payment refunded successfully"
 *               data:
 *                 refund_id: "123e4567-e89b-12d3-a456-426614174123"
 *                 amount: 50
 *                 payment_status: "partially_refunded"
 *       400:
 *         description: Ошибка при инициализации возврата
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentErrorResponse'
 *       401:
 *         description: Неавторизованный доступ
 *       500:
 *         description: Внутренняя ошибка сервера
 */

/**
 * @swagger
 * /api/payments/details/{paymentMethod}/{paymentId}:
 *   get:
 *     summary: Получение детальной информации о платеже
 *     description: |
 *       Возвращает полную информацию о платеже, включая статус, сумму, дату создания и другие детали,
 *       специфичные для выбранной платежной системы.
 *     tags: [Интеграция оплаты]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentMethod
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/PaymentMethod'
 *         description: Метод оплаты (webpay, crypto)
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID платежа (UUID)
 *     responses:
 *       200:
 *         description: Детали платежа успешно получены
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentSuccessResponse'
 *             examples:
 *               webpay:
 *                 value:
 *                   success: true
 *                   message: "Payment details retrieved successfully"
 *                   data:
 *                     id: "123e4567-e89b-12d3-a456-426614174000"
 *                     payment_status: "completed"
 *                     amount: 100
 *                     currency: "BYN"
 *                     created_at: "2023-10-01T12:00:00Z"
 *                     transaction_id: "tx_67890"
 *               crypto:
 *                 value:
 *                   success: true
 *                   message: "Payment details retrieved successfully"
 *                   data:
 *                     id: "123e4567-e89b-12d3-a456-426614174000"
 *                     payment_status: "completed"
 *                     amount: 0.01
 *                     currency: "BTC"
 *                     created_at: "2023-10-01T12:00:00Z"
 *                     crypto_address: "bc1q...xyz"
 *                     transaction_hash: "0x123...abc"
 *       400:
 *         description: Ошибка при получении деталей платежа
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentErrorResponse'
 *       401:
 *         description: Неавторизованный доступ
 *       500:
 *         description: Внутренняя ошибка сервера
 */
