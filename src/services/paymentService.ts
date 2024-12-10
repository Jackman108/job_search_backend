import {Payment} from '../interface/interface.js';
import {executeQuery} from "../utils/queryHelpers.js";


export const createTablePayments = async (): Promise<void> => {
    const query = `
    CREATE TABLE IF NOT EXISTS payments (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      amount DECIMAL NOT NULL,
      payment_status VARCHAR(20) DEFAULT 'pending',
      payment_method VARCHAR(50),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;

    await executeQuery(query);
};


export async function listPayments(status?: string): Promise<Payment[]> {
    let query = `
        SELECT 
          id, 
          user_id AS "userId", 
          amount, payment_status AS "paymentStatus",
          payment_method AS "paymentMethod", 
          created_at AS "createdAt", 
          updated_at AS "updatedAt"
        FROM payments
    `;

    const values = status ? [status] : [];
    if (status) query += ' WHERE payment_status = $1';
    return executeQuery(query, values);
}


export async function getPayment(paymentId: string | number): Promise<Payment> {
    const query = `SELECT * FROM payments WHERE id = $1;`;
    const result = await executeQuery(query, [paymentId]);

    if (result.length === 0) throw new Error(`Payment not found for paymentId: ${paymentId}`);
    return result[0];
}


export async function createPayment(paymentData: Partial<Payment>): Promise<Payment> {
    const query = `
        INSERT INTO payments (user_id, amount, payment_status, payment_method)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
    `;

    const values = [
        paymentData.userId,
        paymentData.amount,
        paymentData.paymentStatus,
        paymentData.paymentMethod
    ];

    const result = await executeQuery(query, values);
    return result[0];
}


export async function updatePayment(id: string | number, updates: Partial<Payment>): Promise<Payment> {
    const updateFields = [];
    const values = [];
    let index = 1;

    if (updates.amount) {
        updateFields.push(`amount = $${index++}`);
        values.push(updates.amount);
    }
    if (updates.paymentStatus) {
        updateFields.push(`payment_status = $${index++}`);
        values.push(updates.paymentStatus);
    }
    if (updates.paymentMethod) {
        updateFields.push(`payment_method = $${index++}`);
        values.push(updates.paymentMethod);
    }

    updateFields.push(`updated_at = $${index++}`);
    values.push(new Date().toISOString());
    values.push(id);

    const updateQuery = `
        UPDATE payments
        SET ${updateFields.join(', ')}
        WHERE id = $${index}
        RETURNING *;
    `;

    const result = await executeQuery(updateQuery, values);
    if (result.length === 0) throw new Error(`Payment with ID ${id} not found.`);
    return result[0];
}


export async function updatePaymentStatus(paymentId: string, status: string): Promise<Payment> {
    const query = `
        UPDATE payments 
        SET payment_status = $1, updated_at = NOW() 
        WHERE id = $2
        RETURNING *;
    `;

    const result = await executeQuery(query, [status, paymentId]);
    if (result.length === 0) throw new Error(`Payment with ID ${paymentId} not found.`);
    return result[0];
}


export const deletePayment = async (paymentId: string | number): Promise<void> => {
    const query = `DELETE FROM payments WHERE id = $1`;
    await executeQuery(query, [paymentId]);
}
