import { PaymentStatus } from '@interface';

/**
 * Моковые данные для криптоплатежей в режиме разработки
 */
export const mockCryptoResponse = {
    id: 'mock-crypto-payment-123',
    subscription_id: 'mock-subscription-123',
    amount: '0.00123456',
    payment_status: PaymentStatus.Pending,
    crypto_address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    crypto_amount: '0.00123456',
    currency: 'BTC',
    created_at: new Date(),
    expires_at: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
    network: 'BTC',
    transaction_hash: null,
    wallet_provider: 'mock'
};

/**
 * Поддерживаемые криптовалюты для моковых данных
 */
export const SUPPORTED_CRYPTO_NETWORKS = [
    { value: 'BTC', label: 'Bitcoin' },
    { value: 'ETH', label: 'Ethereum' },
    { value: 'USDT', label: 'Tether USD' },
    { value: 'BNB', label: 'Binance Coin' }
];

/**
 * Моковые данные методов оплаты криптовалютой
 */
export const mockCryptoPaymentMethods = SUPPORTED_CRYPTO_NETWORKS.map(network => ({
    id: network.value,
    name: network.label,
    icon: `/assets/crypto/${network.value.toLowerCase()}.svg`,
    minAmount: 0.0001,
    maxAmount: 1.0,
    fee: 0.0001,
    processingTime: '10-30 minutes',
    confirmations: network.value === 'BTC' ? 3 : 12
})); 