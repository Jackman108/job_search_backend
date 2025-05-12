import { Payment } from '@interface';
import { checkTableExists, executeQuery } from '@utils';
import { PaymentRepository } from '@repositories/payment.repository';

export const getSubscriptionIdByUserId = async (userId: string): Promise<string> => {
    const query = `
        SELECT * FROM subscriptions 
        WHERE user_id = $1 AND end_date > NOW()
        ORDER BY end_date DESC
        LIMIT 1;
    `;
    const result = await executeQuery(query, [userId]);
    return result[0]?.id;
};

export const createTablePayments = async (): Promise<void> => {
    const tableExists = await checkTableExists('payments');
    if (tableExists) {
        console.log('Table "payments" already exists.');
        return;
    }
    const query = `
    CREATE TABLE IF NOT EXISTS payments (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
      amount DECIMAL NOT NULL,
      payment_status VARCHAR(20) DEFAULT 'pending',
      payment_method VARCHAR(50),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;

    await executeQuery(query);
};

export const createTableCryptoPayments = async (): Promise<void> => {
    const tableExists = await checkTableExists('crypto_payments');
    if (tableExists) {
        console.log('Table "crypto_payments" already exists.');
        return;
    }
    const query = `
    CREATE TABLE IF NOT EXISTS crypto_payments (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
      crypto_address VARCHAR(100) NOT NULL,
      crypto_amount VARCHAR(50) NOT NULL,
      currency VARCHAR(10) NOT NULL,
      status VARCHAR(20) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      expires_at TIMESTAMP NOT NULL
    );
  `;

    await executeQuery(query);
};

export const listPayments = async (userId: string): Promise<Payment[]> => {
    const subscriptionId = await getSubscriptionIdByUserId(userId);
    return await PaymentRepository.list(subscriptionId);
}

export const getPayment = async (
    userId: string, paymentId: string
): Promise<Payment> => {
    const subscriptionId = await getSubscriptionIdByUserId(userId);
    return await PaymentRepository.get(subscriptionId, paymentId);
}

export const createPayment = async (userId: string, paymentData: Partial<Payment>
): Promise<void> => {
    const subscriptionId = await getSubscriptionIdByUserId(userId);
    if (!subscriptionId) {
        throw new Error("Payment not created. subscription not found.");
    }
    await PaymentRepository.create(
        subscriptionId,
        paymentData.amount!,
        paymentData.payment_status || 'pending',
        paymentData.payment_method || 'card'
    );
}

export const updatePayment = async (
    userId: string, paymentId: string, updates: Partial<Payment>
): Promise<void> => {
    const subscriptionId = await getSubscriptionIdByUserId(userId);
    await PaymentRepository.update(subscriptionId, paymentId, updates);
}

export const updatePaymentStatus = async (
    userId: string, paymentId: string, status: string
): Promise<void> => {
    const subscriptionId = await getSubscriptionIdByUserId(userId);
    await PaymentRepository.update(
        subscriptionId,
        paymentId,
        { payment_status: status as Payment['payment_status'] }
    );
}

export const deletePayment = async (
    userId: string, paymentId: string
): Promise<void> => {
    const subscriptionId = await getSubscriptionIdByUserId(userId);
    await PaymentRepository.delete(subscriptionId, paymentId);
}
