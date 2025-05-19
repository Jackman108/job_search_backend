// config/crypto.config.ts
import { CryptoPaymentProvider, CryptoPaymentDetails } from '@interface';
import crypto from 'crypto';
import { PaymentStatus } from 'src/constants/paymentStatus';
import { logger } from 'src/utils/logger';

interface NowPaymentsConfig {
    apiKey: string;
    ipnSecret: string;
    baseUrl: string;
    paymentTimeout: number;
    minAmount: number;
    maxAmount: number;
    defaultCurrency: string;
    maxRetries: number;
    retryDelay: number;
}

// Моковый провайдер для разработки
class MockCryptoPaymentProvider implements CryptoPaymentProvider {
    constructor(private config: NowPaymentsConfig) { }

    async createPayment(amount: number, currency: string): Promise<CryptoPaymentDetails> {
        logger.info('Creating mock crypto payment', { amount, currency });

        if (amount < this.config.minAmount || amount > this.config.maxAmount) {
            logger.error('Invalid payment amount', { amount, min: this.config.minAmount, max: this.config.maxAmount });
            throw new Error(`Amount must be between ${this.config.minAmount} and ${this.config.maxAmount}`);
        }

        const paymentId = crypto.randomUUID();
        const cryptoAmount = (amount * 0.0001).toString();

        logger.info('Mock payment created', { paymentId, cryptoAmount });

        return {
            id: paymentId,
            subscription_id: 'mock_subscription',
            amount: amount.toString(),
            currency: currency || this.config.defaultCurrency,
            network: 'BTC',
            crypto_address: 'mock_crypto_address',
            crypto_amount: cryptoAmount,
            payment_status: PaymentStatus.Pending,
            created_at: new Date(),
            expires_at: new Date(Date.now() + this.config.paymentTimeout * 1000),
            transaction_hash: null,
            wallet_provider: 'mock'
        };
    }

    async checkPaymentStatus(paymentId: string) {
        logger.info('Checking mock payment status', { paymentId });

        // Для dev окружения возвращаем разные статусы
        const statuses = ['pending', 'completed', 'failed', 'expired'];
        const randomIndex = Math.floor(Math.random() * statuses.length);
        return 'pending';
    }

    async processWebhook(data: any, signature: string): Promise<boolean> {
        logger.info('Processing mock webhook', { data });
        return true;
    }
}

// Конфигурация для NOWPayments
const nowPaymentsConfig: NowPaymentsConfig = {
    apiKey: process.env.NOWPAYMENTS_API_KEY || '',
    ipnSecret: process.env.NOWPAYMENTS_IPN_SECRET || '',
    baseUrl: process.env.NODE_ENV === 'production'
        ? 'https://api.nowpayments.io/v1'
        : 'https://api-sandbox.nowpayments.io/v1',
    paymentTimeout: parseInt(process.env.CRYPTO_PAYMENT_TIMEOUT || '86400'),
    minAmount: parseInt(process.env.CRYPTO_MIN_AMOUNT || '1'),
    maxAmount: parseInt(process.env.CRYPTO_MAX_AMOUNT || '10000'),
    defaultCurrency: process.env.CRYPTO_DEFAULT_CURRENCY || 'USDT',
    maxRetries: parseInt(process.env.CRYPTO_MAX_RETRIES || '3'),
    retryDelay: parseInt(process.env.CRYPTO_RETRY_DELAY || '1000')
};

// Вспомогательные функции
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const validateWebhook = (data: any, signature: string) => {
    const hmac = crypto.createHmac('sha512', nowPaymentsConfig.ipnSecret);
    const calculatedSignature = hmac.update(JSON.stringify(data)).digest('hex');
    return calculatedSignature === signature;
};

const retryOperation = async <T>(
    operation: () => Promise<T>,
    maxRetries: number,
    delay: number
): Promise<T> => {
    let lastError: Error | null = null;

    for (let i = 0; i < maxRetries; i++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error as Error;
            logger.warn(`Operation failed, attempt ${i + 1}/${maxRetries}`, { error });
            if (i < maxRetries - 1) {
                await sleep(delay);
            }
        }
    }

    throw lastError;
};

// Выбор провайдера в зависимости от окружения
export const cryptoPaymentProvider: CryptoPaymentProvider =
    process.env.NODE_ENV === 'production'
        ? {
            createPayment: async (amount: number, currency: string) => {
                logger.info('Creating crypto payment', { amount, currency });

                if (amount < nowPaymentsConfig.minAmount || amount > nowPaymentsConfig.maxAmount) {
                    logger.error('Invalid payment amount', { amount, min: nowPaymentsConfig.minAmount, max: nowPaymentsConfig.maxAmount });
                    throw new Error(`Amount must be between ${nowPaymentsConfig.minAmount} and ${nowPaymentsConfig.maxAmount}`);
                }

                return retryOperation(
                    async () => {
                        const response = await fetch(`${nowPaymentsConfig.baseUrl}/payment`, {
                            method: 'POST',
                            headers: {
                                'x-api-key': nowPaymentsConfig.apiKey,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                price_amount: amount,
                                price_currency: currency || nowPaymentsConfig.defaultCurrency,
                                pay_currency: 'btc',
                                ipn_callback_url: `${process.env.API_URL}/api/crypto/webhook`,
                                order_id: `order_${Date.now()}`,
                                order_description: 'Subscription payment'
                            })
                        });

                        if (!response.ok) {
                            const error = await response.json();
                            logger.error('Failed to create payment', { error });
                            throw new Error(`Payment creation failed: ${error.message}`);
                        }

                        const data = await response.json();
                        logger.info('Payment created successfully', { paymentId: data.payment_id });
                        return data;
                    },
                    nowPaymentsConfig.maxRetries,
                    nowPaymentsConfig.retryDelay
                );
            },

            checkPaymentStatus: async (paymentId: string) => {
                logger.info('Checking payment status', { paymentId });

                return retryOperation(
                    async () => {
                        const response = await fetch(`${nowPaymentsConfig.baseUrl}/payment/${paymentId}`, {
                            headers: {
                                'x-api-key': nowPaymentsConfig.apiKey
                            }
                        });

                        if (!response.ok) {
                            const error = await response.json();
                            logger.error('Failed to check payment status', { error });
                            throw new Error(`Status check failed: ${error.message}`);
                        }

                        const data = await response.json();
                        logger.info('Payment status retrieved', { paymentId, status: data.payment_status });
                        return data.payment_status;
                    },
                    nowPaymentsConfig.maxRetries,
                    nowPaymentsConfig.retryDelay
                );
            },

            processWebhook: async (data: any, signature: string) => {
                logger.info('Processing webhook', { data });

                if (!validateWebhook(data, signature)) {
                    logger.error('Invalid webhook signature');
                    throw new Error('Invalid webhook signature');
                }

                // Обработка webhook данных
                logger.info('Webhook processed successfully', { paymentId: data.payment_id });
                return true;
            }
        }
        : new MockCryptoPaymentProvider(nowPaymentsConfig);

export { nowPaymentsConfig };