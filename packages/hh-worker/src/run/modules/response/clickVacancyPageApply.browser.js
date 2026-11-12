/**
 * Browser-side vacancy-page apply click. Plain JS — no tsx `__name` injection.
 * Prefer visible «Откликнуться» text first — Magritte vacancy page CTA is reliable.
 */
module.exports = function clickVacancyPageApplyInPage(sels) {
    function isVisible(el) {
        if (!el) return false;
        var style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
        return el.getClientRects().length > 0;
    }

    var nodes = document.querySelectorAll('a, button, [role="button"]');
    for (var n = 0; n < nodes.length; n++) {
        var btn = nodes[n];
        var text = (btn.textContent || '').replace(/\s+/g, ' ').trim();
        if (text !== 'Откликнуться' && !/^Откликнуться\b/i.test(text)) continue;
        if (!isVisible(btn)) continue;
        btn.scrollIntoView({ block: 'center', inline: 'nearest' });
        btn.click();
        return { ok: true, via: 'text' };
    }

    for (var i = 0; i < sels.length; i++) {
        var el = document.querySelector(sels[i]);
        if (!el || !isVisible(el)) continue;
        el.scrollIntoView({ block: 'center', inline: 'nearest' });
        el.click();
        return { ok: true, via: sels[i] };
    }
    return { ok: false, via: 'none' };
};
