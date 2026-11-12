/**
 * Early apply gates in page context. Plain JS — no tsx `__name`.
 */
module.exports = function detectEarlyPreflightInPage(selectors, successReSource) {
    var body = (document.body && document.body.innerText) || '';
    if (new RegExp(successReSource).test(body)) return 'already';

    function isVisible(el) {
        if (!el) return false;
        var style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
        return el.getClientRects().length > 0;
    }

    // If primary apply CTA still visible, do not treat banner/node as blocking skip.
    var stillApply = false;
    var nodes = document.querySelectorAll('a, button, [role="button"]');
    for (var i = 0; i < nodes.length; i++) {
        var t = (nodes[i].textContent || '').replace(/\s+/g, ' ').trim();
        if ((t === 'Откликнуться' || /^Откликнуться\b/i.test(t)) && isVisible(nodes[i])) {
            stillApply = true;
            break;
        }
    }

    var hidden = document.querySelector(selectors.HIDDEN_RESUME_WARNING);
    var hiddenText = /резюме\s+скрыто|скрыто[еe]?\s+резюме|откройте\s+резюме|сделайте\s+резюме\s+видимым/i.test(
        body,
    );
    if (!stillApply && ((hidden && isVisible(hidden)) || hiddenText)) {
        return 'hidden_resume';
    }

    var question = document.querySelector(selectors.EMPLOYER_QUESTION);
    if (question && !String(question.value || '').trim() && isVisible(question)) {
        return 'employer_questions';
    }

    return null;
};
