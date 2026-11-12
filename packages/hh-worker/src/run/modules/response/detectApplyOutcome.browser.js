/**
 * Post-submit apply outcome in page context. Plain JS — no tsx `__name`.
 */
module.exports = function detectApplyOutcomeInPage(selectors, successReSource) {
    var body = (document.body && document.body.innerText) || '';
    var dialog = (document.querySelector('[role=dialog]') || {}).innerText || '';
    var toastBits = '';
    var toastNodes = document.querySelectorAll(
        '[data-qa*="snackbar"], [data-qa*="toast"], [data-qa*="notification"], [role="status"], [role="alert"]',
    );
    for (var t = 0; t < toastNodes.length; t++) {
        toastBits += ' ' + (toastNodes[t].innerText || '');
    }
    var haystack = body + '\n' + dialog + '\n' + toastBits;
    var captchaImg = !!document.querySelector(selectors.CAPTCHA_IMAGE);
    var captcha = captchaImg || /капч/i.test(dialog) || /капч/i.test(body);

    var formInvalid = [
        document.querySelector(selectors.BLOK_TEXTAREA) &&
            document.querySelector(selectors.BLOK_TEXTAREA).classList.contains(selectors.TEXTAREA_INVALID),
        document.querySelector(selectors.BLOK_RADIO) &&
            document.querySelector(selectors.BLOK_RADIO).classList.contains(selectors.RADIO_INVALID),
        document.querySelector(selectors.BLOCK_CHECKBOX) &&
            document.querySelector(selectors.BLOCK_CHECKBOX).classList.contains(selectors.BLOCK_CHECKBOX_INVALID),
    ].some(Boolean);

    var successRe = new RegExp(successReSource, 'i');
    var success = successRe.test(haystack);

    // Secondary: apply CTA gone after submit, and a soft success cue on the page.
    if (!success && !captcha && !formInvalid) {
        var stillApply = false;
        var nodes = document.querySelectorAll('a, button, [role="button"]');
        for (var i = 0; i < nodes.length; i++) {
            var text = (nodes[i].textContent || '').replace(/\s+/g, ' ').trim();
            if (text === 'Откликнуться' || /^Откликнуться\b/i.test(text)) {
                var style = window.getComputedStyle(nodes[i]);
                if (style.display !== 'none' && style.visibility !== 'hidden' && nodes[i].getClientRects().length) {
                    stillApply = true;
                    break;
                }
            }
        }
        if (!stillApply && /отклик|резюме\s+отправлен|уже\s+отклик/i.test(haystack)) {
            success = true;
        }
    }

    return {
        success: !!success,
        captcha: !!captcha,
        formInvalid: !!formInvalid,
    };
};
