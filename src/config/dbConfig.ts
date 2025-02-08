import pkg from 'pg';
import dotenv from 'dotenv';

const {Pool} = pkg;
dotenv.config();

const pool = new Pool({
    port: parseInt(process.env.DB_PORT as string, 10) || 5432,
    host: process.env.DB_HOST || 'localhost',
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'password',
    database: process.env.POSTGRES_DB || 'db_vacancy',
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

export default pool;
