/**
 * Сервис мониторинга платежей
 * Предоставляет функциональность для сбора метрик и мониторинга платежных операций
 */
import { PaymentMonitoring } from '@interface';
import { logger } from '@utils';

/**
 * Создает функциональный сервис мониторинга платежей без использования классов
 * @returns Сервис мониторинга платежей
 */
export const createPaymentMonitoring = (): PaymentMonitoring => {
    // Метрики платежей
    const metrics = {
        // Общая статистика
        totalAttempts: 0,
        successfulPayments: 0,
        failedPayments: 0,
        totalAmount: 0,

        // Статистика по методам платежей
        byMethod: {} as Record<string, {
            attempts: number;
            successful: number;
            failed: number;
            totalAmount: number;
        }>,

        // Статистика по ошибкам
        byErrorCode: {} as Record<string, number>,

        // Временные метрики
        startTime: Date.now(),
        lastPaymentTime: 0,

        // Подробная статистика за периоды
        hourlyStats: [] as Array<{
            hour: string;
            attempts: number;
            successful: number;
            failed: number;
            amount: number;
        }>,
    };

    // Сохраняем детальную информацию о последних платежах для анализа
    const recentPayments: Array<{
        id: string;
        method: string;
        timestamp: number;
        status: 'success' | 'failure';
        amount?: number;
        errorCode?: string;
    }> = [];

    // Максимальное количество сохраняемых платежей
    const MAX_RECENT_PAYMENTS = 100;

    /**
     * Инициализирует почасовую статистику
     */
    const initializeHourlyStats = (): void => {
        const now = new Date();
        const hour = now.getHours();

        metrics.hourlyStats = [{
            hour: `${hour}:00-${hour + 1}:00`,
            attempts: 0,
            successful: 0,
            failed: 0,
            amount: 0
        }];
    };

    /**
     * Обновляет почасовую статистику
     */
    const rotateHourlyStats = (): void => {
        const now = new Date();
        const hour = now.getHours();

        // Сохраняем только последние 24 часа
        if (metrics.hourlyStats.length >= 24) {
            metrics.hourlyStats.shift();
        }

        // Добавляем новый час
        metrics.hourlyStats.push({
            hour: `${hour}:00-${hour + 1}:00`,
            attempts: 0,
            successful: 0,
            failed: 0,
            amount: 0
        });
    };

    /**
     * Обновляет статистику текущего часа
     */
    const updateCurrentHourStats = (stats: {
        attempts?: number;
        successful?: number;
        failed?: number;
        amount?: number;
    }): void => {
        const currentHour = metrics.hourlyStats[metrics.hourlyStats.length - 1];

        if (stats.attempts) currentHour.attempts += stats.attempts;
        if (stats.successful) currentHour.successful += stats.successful;
        if (stats.failed) currentHour.failed += stats.failed;
        if (stats.amount) currentHour.amount += stats.amount;
    };

    /**
     * Добавляет платеж в список последних
     */
    const addToRecentPayments = (payment: {
        id: string;
        method: string;
        timestamp: number;
        status: 'success' | 'failure';
        amount?: number;
        errorCode?: string;
    }): void => {
        // Удаляем самый старый платеж, если достигнут лимит
        if (recentPayments.length >= MAX_RECENT_PAYMENTS) {
            recentPayments.shift();
        }

        recentPayments.push(payment);
    };

    /**
     * Обновляет платеж в списке последних
     */
    const updateRecentPayment = (
        paymentId: string,
        updates: {
            status: 'success' | 'failure';
            amount?: number;
            errorCode?: string;
        }
    ): void => {
        const paymentIndex = recentPayments.findIndex(p => p.id === paymentId);

        if (paymentIndex >= 0) {
            recentPayments[paymentIndex] = {
                ...recentPayments[paymentIndex],
                ...updates
            };

            // Если успешный платеж, обновляем статистику по методу
            if (updates.status === 'success' && updates.amount !== undefined) {
                const method = recentPayments[paymentIndex].method;

                if (metrics.byMethod[method]) {
                    metrics.byMethod[method].successful++;
                    metrics.byMethod[method].totalAmount += updates.amount;
                }
            } else if (updates.status === 'failure') {
                // Если неудачный платеж, обновляем статистику по методу
                const method = recentPayments[paymentIndex].method;

                if (metrics.byMethod[method]) {
                    metrics.byMethod[method].failed++;
                }
            }
        }
    };

    // Инициализация статистики
    initializeHourlyStats();

    // Настройка периодического обновления статистики
    setInterval(rotateHourlyStats, 60 * 60 * 1000);

    // Возвращаем публичный интерфейс мониторинга
    return {
        registerAttempt: (paymentId: string, method: string): void => {
            // Обновляем общую статистику
            metrics.totalAttempts++;
            metrics.lastPaymentTime = Date.now();

            // Обновляем статистику по методу
            if (!metrics.byMethod[method]) {
                metrics.byMethod[method] = {
                    attempts: 0,
                    successful: 0,
                    failed: 0,
                    totalAmount: 0
                };
            }

            metrics.byMethod[method].attempts++;

            // Обновляем почасовую статистику
            updateCurrentHourStats({ attempts: 1 });

            // Добавляем в список последних платежей
            addToRecentPayments({
                id: paymentId,
                method,
                timestamp: Date.now(),
                status: 'success' // Временно, будет обновлено при успехе или ошибке
            });

            logger.info(`Payment attempt registered: ${paymentId} (${method})`);
        },

        registerSuccess: (paymentId: string, amount: number): void => {
            // Обновляем общую статистику
            metrics.successfulPayments++;
            metrics.totalAmount += amount;

            // Обновляем почасовую статистику
            updateCurrentHourStats({
                successful: 1,
                amount
            });

            // Обновляем платеж в списке последних
            updateRecentPayment(paymentId, {
                status: 'success',
                amount
            });

            logger.info(`Payment success registered: ${paymentId} (${amount})`);
        },

        registerFailure: (paymentId: string, errorCode: string): void => {
            // Обновляем общую статистику
            metrics.failedPayments++;

            // Обновляем статистику по ошибкам
            if (!metrics.byErrorCode[errorCode]) {
                metrics.byErrorCode[errorCode] = 0;
            }

            metrics.byErrorCode[errorCode]++;

            // Обновляем почасовую статистику
            updateCurrentHourStats({ failed: 1 });

            // Обновляем платеж в списке последних
            updateRecentPayment(paymentId, {
                status: 'failure',
                errorCode
            });

            logger.info(`Payment failure registered: ${paymentId} (${errorCode})`);
        },

        getMetrics: (): Record<string, any> => {
            return {
                ...metrics,
                uptime: Date.now() - metrics.startTime,
                recentPayments: [...recentPayments]
            };
        }
    };
};

/**
 * Экземпляр сервиса мониторинга для глобального использования
 */
export const paymentMonitoring = createPaymentMonitoring(); 