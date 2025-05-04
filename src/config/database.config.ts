import pkg from 'pg';
import { ENV } from '@config';

const { Pool } = pkg;

// Настройки подключения к базе данных
export const DB_CONFIG = {
    port: parseInt(process.env.DB_PORT as string, 10) || 5432,
    host: process.env.DB_HOST || 'localhost',
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'password',
    database: process.env.POSTGRES_DB || 'db_vacancy',
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
};

// Создание пула соединений
const pool = new Pool(DB_CONFIG);

// Проверка подключения к базе данных
pool.connect()
    .then(client => {
        console.log('Successfully connected to PostgreSQL');
        client.release();
    })
    .catch(err => {
        console.error('Error connecting to PostgreSQL:', err);
        if (ENV.isProduction) {
            process.exit(-1);
        }
    });

// Обработка ошибок пула
pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    if (ENV.isProduction) {
        process.exit(-1);
    }
});

export default pool; 