import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { loginErrorTextMatches } from './loginErrorText.js';

describe('loginErrorTextMatches', () => {
    it('detects Magritte bare Ошибка on password step', () => {
        assert.equal(loginErrorTextMatches('Введите пароль\nОшибка\nВойти'), true);
    });

    it('detects Magritte toast + field error', () => {
        assert.equal(
            loginErrorTextMatches('Произошла ошибка. Попробуйте перезагрузить страницу.\nВведите пароль\nОшибка'),
            true,
        );
    });

    it('ignores clean password prompt', () => {
        assert.equal(loginErrorTextMatches('Введите пароль\nВойти\nВойти по коду'), false);
    });
});
