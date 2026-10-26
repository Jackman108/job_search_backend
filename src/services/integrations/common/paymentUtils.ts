/**
 * Вспомогательные функции для работы с платежами
 */
import { PaymentStatus } from '@interface';

/**
 * Преобразует значение в строку, безопасно обрабатывая undefined и null
 * @param value Значение для преобразования
 * @param defaultValue Значение по умолчанию
 * @returns Строковое представление значения
 */
export const safeToString = (value: any, defaultValue: string = ''): string => {
    if (value === undefined || value === null) {
        return defaultValue;
    }
    return String(value);
};

/**
 * Преобразует статус платежа из NOWPayments в стандартный формат
 * @param nowpaymentsStatus Статус платежа из NOWPayments
 * @returns Стандартизированный статус платежа
 */
export const mapNowPaymentsStatus = (nowpaymentsStatus: string): PaymentStatus => {
    const statusMap: Record<string, PaymentStatus> = {
        'waiting': PaymentStatus.Pending,
        'confirming': PaymentStatus.Processing,
        'confirmed': PaymentStatus.OnHold,
        'sending': PaymentStatus.Processing,
        'partially_paid': PaymentStatus.OnHold,
        'finished': PaymentStatus.Completed,
        'failed': PaymentStatus.Failed,
        'expired': PaymentStatus.Expired,
        'refunded': PaymentStatus.Refunded
    };

    return statusMap[nowpaymentsStatus.toLowerCase()] || PaymentStatus.Pending;
};

/**
 * Форматирует дату для использования в запросах
 * @param date Дата для форматирования
 * @returns Отформатированная строка даты
 */
export const formatDateForQuery = (date: Date | string | undefined): string => {
    if (!date) {
        return new Date().toISOString();
    }

    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toISOString();
};

/**
 * Проверяет, является ли строка валидным UUID
 * @param str Строка для проверки
 * @returns true если строка является валидным UUID
 */
export const isValidUuid = (str: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
};

/**
 * Генерирует уникальный идентификатор транзакции
 * @param prefix Префикс для идентификатора
 * @returns Уникальный идентификатор транзакции
 */
export const generateTransactionId = (prefix: string = 'TX'): string => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `${prefix}-${timestamp}-${random}`;
}; 