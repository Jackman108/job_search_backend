// config/crypto.config.ts
import { CryptoPaymentProvider } from '@interface';

interface NowPaymentsConfig {
    apiKey: string;
    ipnSecret: string;
    baseUrl: string;
    paymentTimeout: number;
    minAmount: number;
    maxAmount: number;
    defaultCurrency: string;
}

// Моковый провайдер для разработки
class MockCryptoPaymentProvider implements CryptoPaymentProvider {
    constructor(private config: NowPaymentsConfig) { }

    async createPayment(amount: number, currency: string) {
        if (amount < this.config.minAmount || amount > this.config.maxAmount) {
            throw new Error(`Amount must be between ${this.config.minAmount} and ${this.config.maxAmount}`);
        }

        return {
            paymentId: `mock_${Date.now()}`,
            cryptoAddress: 'mock_crypto_address',
            cryptoAmount: (amount * 0.0001).toString(),
            currency: currency || this.config.defaultCurrency,
            status: 'pending',
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + this.config.paymentTimeout * 1000)
        };
    }

    async checkPaymentStatus(paymentId: string) {
        return 'pending';
    }

    async processWebhook(data: any) {
        console.log('Mock webhook received:', data);
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
    defaultCurrency: process.env.CRYPTO_DEFAULT_CURRENCY || 'USDT'
};

// Выбор провайдера в зависимости от окружения
export const cryptoPaymentProvider: CryptoPaymentProvider =
    process.env.NODE_ENV === 'production'
        ? {
            createPayment: async (amount: number, currency: string) => {
                if (amount < nowPaymentsConfig.minAmount || amount > nowPaymentsConfig.maxAmount) {
                    throw new Error(`Amount must be between ${nowPaymentsConfig.minAmount} and ${nowPaymentsConfig.maxAmount}`);
                }

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
                return response.json();
            },
            checkPaymentStatus: async (paymentId: string) => {
                const response = await fetch(`${nowPaymentsConfig.baseUrl}/payment/${paymentId}`, {
                    headers: {
                        'x-api-key': nowPaymentsConfig.apiKey
                    }
                });
                const data = await response.json();
                return data.payment_status;
            },
            processWebhook: async (data: any) => {
                console.log('Production webhook received:', data);
            }
        }
        : new MockCryptoPaymentProvider(nowPaymentsConfig);

export { nowPaymentsConfig };