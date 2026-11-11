-- init.sql
SELECT 'CREATE DATABASE db_vacancy' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'db_vacancy');
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\c db_vacancy;

CREATE TABLE IF NOT EXISTS vacancies (
    id BIGINT PRIMARY KEY,
    title_vacancy VARCHAR(255) NOT NULL,
    url_vacancy TEXT NOT NULL,
    title_company VARCHAR(255) NOT NULL,
    url_company TEXT NOT NULL,
    vacancy_status BOOLEAN NOT NULL DEFAULT FALSE,
    response_date TIMESTAMP
);

-- HH account credentials + search-field configs (also auto-created by services if missing)
CREATE TABLE IF NOT EXISTS vacancy_auth (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vacancy_submit (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    position TEXT,
    message TEXT,
    vacancy_url TEXT,
    schedule TEXT,
    order_by TEXT,
    search_field TEXT,
    experience TEXT,
    search_period TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
