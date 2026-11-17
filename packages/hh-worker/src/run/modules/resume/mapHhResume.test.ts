import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { mapHhResume } from './mapHhResume.js';

describe('mapHhResume', () => {
    it('maps core fields from HH API resume', () => {
        const mapped = mapHhResume({
            first_name: 'Иван',
            last_name: 'Иванов',
            middle_name: 'Иванович',
            title: 'Fullstack Developer',
            employments: [{ id: 'full', name: 'Полная занятость' }],
            schedules: [{ id: 'remote', name: 'Удалённая работа' }],
            travel_time: { id: 'any', name: 'Не имеет значения' },
            business_trip_readiness: { id: 'ready', name: 'Готов' },
            contact: [
                { type: { id: 'cell', name: 'Мобильный' }, value: '+375291112233' },
                { type: { id: 'email', name: 'Эл. почта' }, value: 'a@b.c' },
            ],
            skill_set: ['TypeScript', 'Node.js'],
            experience: [
                {
                    company: 'Acme',
                    position: 'Dev',
                    start: '2020-01-01',
                    end: null,
                    description: 'Built stuff',
                },
            ],
        });

        assert.equal(mapped.resume.full_name, 'Иванов Иван Иванович');
        assert.equal(mapped.resume.position, 'Fullstack Developer');
        assert.equal(mapped.resume.employment_type, 'Полная занятость');
        assert.equal(mapped.resume.work_schedule, 'Удалённая работа');
        assert.equal(mapped.resume.business_trip_readiness, true);
        assert.equal(mapped.contacts.phone, '+375291112233');
        assert.equal(mapped.contacts.email, 'a@b.c');
        assert.equal(mapped.skills.length, 2);
        assert.equal(mapped.workExperience[0].company_name, 'Acme');
        assert.equal(mapped.workExperience[0].end_date, null);
    });

    it('falls back when name parts missing', () => {
        const mapped = mapHhResume({ title: 'Only title' });
        assert.equal(mapped.resume.full_name, 'Only title');
        assert.equal(mapped.contacts.phone, '—');
        assert.equal(mapped.resume.business_trip_readiness, false);
    });
});
