-- S4: shared vacancies / feedbacks with user_id (replace per-user "${userId}_*" tables).
-- Data copy + rename of legacy tables: yarn migrate:s4 [--dry-run]

CREATE TABLE IF NOT EXISTS vacancies (
    user_id UUID NOT NULL,
    id BIGINT NOT NULL,
    title_vacancy VARCHAR(255),
    url_vacancy TEXT,
    title_company VARCHAR(255),
    url_company TEXT,
    vacancy_status VARCHAR(50),
    response_date TIMESTAMP,
    PRIMARY KEY (user_id, id)
);

CREATE INDEX IF NOT EXISTS vacancies_user_response_date
    ON vacancies (user_id, response_date DESC NULLS LAST);

CREATE TABLE IF NOT EXISTS feedbacks (
    user_id UUID NOT NULL,
    id BIGINT NOT NULL,
    vacancy_id BIGINT NOT NULL,
    feedback_text TEXT,
    feedback_date TIMESTAMP DEFAULT NOW(),
    response_status VARCHAR(50),
    title_vacancy VARCHAR(255),
    title_company VARCHAR(255),
    PRIMARY KEY (user_id, id)
);

CREATE INDEX IF NOT EXISTS feedbacks_user_feedback_date
    ON feedbacks (user_id, feedback_date DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS feedbacks_user_vacancy_id
    ON feedbacks (user_id, vacancy_id);
