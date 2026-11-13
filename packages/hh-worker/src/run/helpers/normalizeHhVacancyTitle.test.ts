import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { normalizeHhVacancyTitle } from './normalizeHhVacancyTitle.js';

describe('normalizeHhVacancyTitle', () => {
    it('returns empty for blank, placeholder, or bare brand shells', () => {
        assert.equal(normalizeHhVacancyTitle(''), '');
        assert.equal(normalizeHhVacancyTitle('   '), '');
        assert.equal(normalizeHhVacancyTitle('Заголовок не найден'), '');
        assert.equal(normalizeHhVacancyTitle('HeadHunter'), '');
    });

    it('keeps plain job titles', () => {
        assert.equal(normalizeHhVacancyTitle('Backend Node.js'), 'Backend Node.js');
        assert.equal(
            normalizeHhVacancyTitle('  Senior Backend-разработчик (Node.js / NestJS) '),
            'Senior Backend-разработчик (Node.js / NestJS)',
        );
    });

    it('strips HH document / og title wrappers', () => {
        assert.equal(
            normalizeHhVacancyTitle(
                'Вакансия Senior Software Developer (Full-stack, Backend-focused) в Минске, работа в компании Тогл Софт / Toggle',
            ),
            'Senior Software Developer (Full-stack, Backend-focused)',
        );
    });
});
