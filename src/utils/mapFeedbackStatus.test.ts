import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { mapFeedbackStatus, pickBestFeedbackStatus } from './mapFeedbackStatus.js';

describe('mapFeedbackStatus', () => {
    it('maps invite / interview forms', () => {
        assert.equal(mapFeedbackStatus('Приглашение на работу'), 'Приглашение');
        assert.equal(mapFeedbackStatus('Вас пригласили на собеседование'), 'Приглашение');
        assert.equal(mapFeedbackStatus('Собеседование'), 'Приглашение');
    });

    it('maps reject and viewed', () => {
        assert.equal(mapFeedbackStatus('Отказ'), 'Отказ');
        assert.equal(mapFeedbackStatus('Резюме просмотрено'), 'Резюме просмотрено');
    });

    it('does not treat «не готовы пригласить» as invite', () => {
        const letter =
            'Большое спасибо за интерес к нашей компании! К сожалению, сейчас мы не готовы пригласить вас на следующий этап.';
        assert.equal(mapFeedbackStatus(letter), 'Отказ');
    });

    it('maps list labels', () => {
        assert.equal(mapFeedbackStatus('Отклик на вакансию'), 'Не рассмотрен');
        assert.equal(mapFeedbackStatus('Собеседование'), 'Приглашение');
    });

    it('defaults unknown', () => {
        assert.equal(mapFeedbackStatus(''), 'Не рассмотрен');
        assert.equal(mapFeedbackStatus('Что-то ещё'), 'Не рассмотрен');
    });
});

describe('pickBestFeedbackStatus', () => {
    it('prefers reject over invite when both signals present', () => {
        assert.equal(pickBestFeedbackStatus(['Собеседование', 'Отказ']), 'Отказ');
        assert.equal(pickBestFeedbackStatus(['Отказ', 'не готовы пригласить вас на следующий этап']), 'Отказ');
    });

    it('prefers invite over viewed', () => {
        assert.equal(pickBestFeedbackStatus(['Резюме просмотрено', 'Вас пригласили']), 'Приглашение');
    });
});
