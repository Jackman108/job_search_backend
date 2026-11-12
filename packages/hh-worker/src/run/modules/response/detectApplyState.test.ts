import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isApplySuccessText, isCaptchaText } from './detectApplyState.js';

describe('detectApplyState helpers', () => {
    it('detects Magritte success copy', () => {
        assert.equal(isApplySuccessText('Вы откликнулись на вакансию'), true);
        assert.equal(isApplySuccessText('Вы  откликнулись'), true);
        assert.equal(isApplySuccessText('Отклик отправлен'), true);
        assert.equal(isApplySuccessText('Резюме отправлено работодателю'), true);
        assert.equal(isApplySuccessText('что-то другое'), false);
    });

    it('detects captcha wording', () => {
        assert.equal(isCaptchaText('Введите капчу'), true);
        assert.equal(isCaptchaText('CAPTCHA challenge'), false);
        assert.equal(isCaptchaText('ok'), false);
    });
});
