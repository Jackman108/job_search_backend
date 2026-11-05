CREATE TABLE IF NOT EXISTS webpay_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    wsb_order_num VARCHAR(100) NOT NULL,
    wsb_currency_id VARCHAR(10) NOT NULL,
    wsb_total DECIMAL(10,2) NOT NULL,
    transaction_id VARCHAR(100),
    payment_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    signature VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    success_url VARCHAR(255),
    cancel_url VARCHAR(255),
    UNIQUE(wsb_order_num)
);

CREATE INDEX IF NOT EXISTS idx_webpay_payment_id ON webpay_payments(payment_id);
CREATE INDEX IF NOT EXISTS idx_webpay_order_num ON webpay_payments(wsb_order_num);
CREATE INDEX IF NOT EXISTS idx_webpay_status ON webpay_payments(payment_status);