import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { loginErrorTextMatches, loginTransientReloadMatches } from './loginErrorText.js';

describe('loginErrorTextMatches', () => {
    it('detects Magritte bare Ошибка on password step', () => {
        assert.equal(loginErrorTextMatches('Введите пароль\nОшибка\nВойти'), true);
    });

    it('detects Magritte field error even when reload toast is also present', () => {
        assert.equal(
            loginErrorTextMatches('Произошла ошибка. Попробуйте перезагрузить страницу.\nВведите пароль\nОшибка'),
            true,
        );
    });

    it('ignores clean password prompt', () => {
        assert.equal(loginErrorTextMatches('Введите пароль\nВойти\nВойти по коду'), false);
    });

    it('does not treat reload toast alone as bad credentials', () => {
        assert.equal(loginErrorTextMatches('Произошла ошибка. Попробуйте перезагрузить страницу.'), false);
    });
});

describe('loginTransientReloadMatches', () => {
    it('detects Magritte reload toast', () => {
        assert.equal(
            loginTransientReloadMatches('Произошла ошибка. Попробуйте перезагрузить страницу.\nВведите пароль'),
            true,
        );
    });

    it('ignores field-only Ошибка', () => {
        assert.equal(loginTransientReloadMatches('Введите пароль\nОшибка\nВойти'), false);
    });
});
