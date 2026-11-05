/**
 * Сервис для кэширования платежных данных
 * Предоставляет функциональность для эффективного управления кэшем платежей
 */
import { PaymentCache, PaymentStatus } from '@interface';
import { logger } from '@utils';

/**
 * Создает функциональный сервис кэширования платежных данных
 * @returns Сервис кэширования платежей
 */
export const createPaymentCache = (): PaymentCache => {
    // Симуляция хранилища кэша платежей (в продакшене использовать Redis или другое решение)
    const paymentStore = new Map<string, { data: any; expiry: number }>();
    const statusStore = new Map<string, { status: PaymentStatus; expiry: number }>();

    // Время жизни кэша по умолчанию (30 минут в миллисекундах)
    const DEFAULT_TTL = 30 * 60 * 1000;

    /**
     * Очищает истекшие записи из кэша
     */
    const cleanupExpiredRecords = (): void => {
        const now = Date.now();
        let removedCount = 0;

        // Очищаем данные платежей
        for (const [key, value] of paymentStore.entries()) {
            if (value.expiry < now) {
                paymentStore.delete(key);
                removedCount++;
            }
        }

        // Очищаем статусы платежей
        for (const [key, value] of statusStore.entries()) {
            if (value.expiry < now) {
                statusStore.delete(key);
                removedCount++;
            }
        }

        if (removedCount > 0) {
            logger.info(`Removed ${removedCount} expired payment cache records`);
        }
    };

    // Инициализируем периодическую очистку истекших записей
    setInterval(cleanupExpiredRecords, 5 * 60 * 1000);

    // Возвращаем публичный интерфейс кэша
    return {
        /**
         * Получает данные платежа из кэша
         * @param paymentId ID платежа
         * @returns Данные платежа или null, если не найдены
         */
        getPayment: async (paymentId: string): Promise<any | null> => {
            const cached = paymentStore.get(paymentId);

            if (cached && cached.expiry > Date.now()) {
                logger.info(`Payment cache hit: ${paymentId}`);
                return cached.data;
            }

            logger.info(`Payment cache miss: ${paymentId}`);
            return null;
        },

        /**
         * Сохраняет данные платежа в кэш
         * @param paymentId ID платежа
         * @param data Данные платежа
         * @param ttl Время жизни записи в миллисекундах
         */
        setPayment: async (paymentId: string, data: any, ttl: number = DEFAULT_TTL): Promise<void> => {
            paymentStore.set(paymentId, {
                data,
                expiry: Date.now() + ttl
            });

            logger.info(`Payment cached: ${paymentId}`);
        },

        /**
         * Инвалидирует кэш платежа
         * @param paymentId ID платежа
         */
        invalidatePayment: async (paymentId: string): Promise<void> => {
            paymentStore.delete(paymentId);
            statusStore.delete(paymentId);

            logger.info(`Payment cache invalidated: ${paymentId}`);
        },

        /**
         * Получает статус платежа из кэша
         * @param paymentId ID платежа
         * @returns Статус платежа или null, если не найден
         */
        getStatus: async (paymentId: string): Promise<PaymentStatus | null> => {
            const cached = statusStore.get(paymentId);

            if (cached && cached.expiry > Date.now()) {
                logger.info(`Payment status cache hit: ${paymentId}`);
                return cached.status;
            }

            logger.info(`Payment status cache miss: ${paymentId}`);
            return null;
        },

        /**
         * Сохраняет статус платежа в кэш
         * @param paymentId ID платежа
         * @param status Статус платежа
         * @param ttl Время жизни записи в миллисекундах
         */
        setStatus: async (paymentId: string, status: PaymentStatus, ttl: number = DEFAULT_TTL): Promise<void> => {
            statusStore.set(paymentId, {
                status,
                expiry: Date.now() + ttl
            });

            logger.info(`Payment status cached: ${paymentId} = ${status}`);
        }
    };
};

// Создаем и экспортируем сервис кэширования платежей
export const paymentCacheManager = createPaymentCache(); 