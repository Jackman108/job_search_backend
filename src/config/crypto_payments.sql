-- Таблица для криптоплатежей
CREATE TABLE IF NOT EXISTS crypto_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id UUID NOT NULL REFERENCES subscriptions(id),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    crypto_address VARCHAR(100) NOT NULL,
    crypto_amount DECIMAL(20,8) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'finished', 'failed', 'expired')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    transaction_hash VARCHAR(100),
    network VARCHAR(20) NOT NULL,
    wallet_provider VARCHAR(50) NOT NULL
);

-- Таблица для логов вебхуков
CREATE TABLE IF NOT EXISTS webhook_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID NOT NULL REFERENCES crypto_payments(id),
    status VARCHAR(20) NOT NULL,
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    retry_count INTEGER DEFAULT 0,
    last_retry_at TIMESTAMP WITH TIME ZONE
);

-- Индексы для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_crypto_payments_status ON crypto_payments(status);
CREATE INDEX IF NOT EXISTS idx_crypto_payments_subscription_id ON crypto_payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_payment_id ON webhook_logs(payment_id); 