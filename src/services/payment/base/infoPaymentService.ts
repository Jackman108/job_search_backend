import { USE_MOCK_PROVIDER } from '@config';
import { getSubscriptionIdByUserId, withErrorHandling } from '@services';

/**
 * Получение информации о доступных платежных методах
 * @returns Список платежных методов с их параметрами
 */
export const getPaymentMethods = async () => {
    // Базовые методы оплаты
    const paymentMethods = [
        {
            id: 'webpay',
            name: 'WebPay',
            description: 'Оплата банковской картой',
            currencies: ['BYN', 'USD', 'EUR', 'RUB'],
            icon: '/assets/icons/card.svg'
        },
        {
            id: 'crypto',
            name: 'Криптовалюта',
            description: 'Оплата Bitcoin, Ethereum и др.',
            currencies: ['BTC', 'ETH', 'USDT'],
            icon: '/assets/icons/crypto.svg'
        }
    ];

    // В режиме разработки добавляем информацию о тестовом режиме
    if (USE_MOCK_PROVIDER) {
        paymentMethods.forEach(method => {
            method.name += ' (Тестовый режим)';
            method.description += '. Платеж будет автоматически завершен через 1 минуту.';
        });
    }

    return paymentMethods;
};

/**
 * Получение информации о текущем тарифе пользователя
 * @param userId ID пользователя
 * @returns Информация о подписке
 */
export const getCurrentPlan = async (userId: string) => {
    const subscriptionId = await getSubscriptionIdByUserId(userId);

    if (!subscriptionId) {
        return { hasActiveSubscription: false };
    }

    return {
        hasActiveSubscription: true,
        subscriptionId
    };
};

/**
 * Получение HTML-страницы для тестирования платежей
 * @returns HTML-код страницы
 */
export const getTestPaymentPageHtml = () => {
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Test Payment Page</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            .payment-method { border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 5px; }
            .payment-method:hover { background-color: #f5f5f5; }
            button { padding: 10px 15px; background-color: #4CAF50; color: white; border: none; cursor: pointer; }
            button:hover { background-color: #45a049; }
            .mock-mode { color: red; font-weight: bold; }
            .field { margin-bottom: 10px; }
            label { display: block; margin-bottom: 5px; }
            input, select { width: 100%; padding: 8px; box-sizing: border-box; }
        </style>
    </head>
    <body>
        <h1>Тестовая страница оплаты</h1>
        ${USE_MOCK_PROVIDER ? '<p class="mock-mode">РЕЖИМ РАЗРАБОТКИ: Платежи будут автоматически завершены через 1 минуту</p>' : ''}
        
        <div class="payment-method">
            <h2>WebPay Payment</h2>
            <div class="field">
                <label for="webpay-amount">Сумма</label>
                <input type="number" id="webpay-amount" value="10.00" min="1" step="0.01">
            </div>
            <div class="field">
                <label for="webpay-currency">Валюта</label>
                <select id="webpay-currency">
                    <option value="BYN">BYN</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="RUB">RUB</option>
                </select>
            </div>
            <button onclick="makeWebpayPayment()">Оплатить через WebPay</button>
        </div>
        
        <div class="payment-method">
            <h2>Crypto Payment</h2>
            <div class="field">
                <label for="crypto-amount">Сумма</label>
                <input type="number" id="crypto-amount" value="10.00" min="1" step="0.01">
            </div>
            <div class="field">
                <label for="crypto-currency">Валюта</label>
                <select id="crypto-currency">
                    <option value="BTC">BTC</option>
                    <option value="ETH">ETH</option>
                    <option value="USDT">USDT</option>
                </select>
            </div>
            <button onclick="makeCryptoPayment()">Оплатить криптовалютой</button>
        </div>
        
        <div id="result" style="margin-top: 20px; padding: 10px; border: 1px solid #ddd; display: none;"></div>
        
        <script>
            async function makeWebpayPayment() {
                const amount = document.getElementById('webpay-amount').value;
                const currency = document.getElementById('webpay-currency').value;
                
                const result = document.getElementById('result');
                result.style.display = 'block';
                result.innerHTML = 'Инициализация WebPay платежа...';
                
                try {
                    const response = await fetch('/api/payments/webpay/init', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            subscription_id: '12345678-1234-1234-1234-123456789012', // Тестовый ID
                            amount: parseFloat(amount),
                            currency
                        })
                    });
                    
                    const data = await response.json();
                    
                    if (response.ok) {
                        result.innerHTML = '<h3>Платеж инициализирован успешно!</h3><pre>' + 
                            JSON.stringify(data, null, 2) + '</pre>';
                        
                        // В режиме разработки показываем детали, в продакшене делаем редирект
                        if (!${USE_MOCK_PROVIDER} && data.redirectUrl) {
                            window.location.href = data.redirectUrl;
                        }
                    } else {
                        result.innerHTML = '<h3>Ошибка!</h3><pre>' + 
                            JSON.stringify(data, null, 2) + '</pre>';
                    }
                } catch (error) {
                    result.innerHTML = '<h3>Ошибка!</h3><p>' + error.message + '</p>';
                }
            }
            
            async function makeCryptoPayment() {
                const amount = document.getElementById('crypto-amount').value;
                const currency = document.getElementById('crypto-currency').value;
                
                const result = document.getElementById('result');
                result.style.display = 'block';
                result.innerHTML = 'Инициализация Crypto платежа...';
                
                try {
                    const response = await fetch('/api/payments/crypto/init', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            id: 'crypto-' + Date.now(),
                            subscription_id: '12345678-1234-1234-1234-123456789012', // Тестовый ID
                            amount: parseFloat(amount),
                            currency
                        })
                    });
                    
                    const data = await response.json();
                    
                    if (response.ok) {
                        result.innerHTML = '<h3>Платеж инициализирован успешно!</h3><pre>' + 
                            JSON.stringify(data, null, 2) + '</pre>';
                    } else {
                        result.innerHTML = '<h3>Ошибка!</h3><pre>' + 
                            JSON.stringify(data, null, 2) + '</pre>';
                    }
                } catch (error) {
                    result.innerHTML = '<h3>Ошибка!</h3><p>' + error.message + '</p>';
                }
            }
        </script>
    </body>
    </html>
    `;

    return html;
};

/**
 * Операции с информацией о платежах с обработкой ошибок
 */
export const infoPaymentOperations = {
    getPaymentMethods: () => withErrorHandling(async () => await getPaymentMethods()),
    getCurrentPlan: (userId: string) => withErrorHandling(async () => await getCurrentPlan(userId)),
    getTestPaymentPageHtml: () => withErrorHandling(async () => getTestPaymentPageHtml())
}; 